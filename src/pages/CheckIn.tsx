import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Question {
  id: number;
  text: string;
  type: "yesno" | "text" | "scale";
}

interface UserAddiction {
  id: string;
  name: string;
  isOriginal: boolean;
}

const questions: Question[] = [
  { id: 1, text: "¿Me mantuve limpio de consumo hoy?", type: "yesno" },
  { id: 2, text: "¿Encontré alguna situación que me alterara hoy?", type: "yesno" },
  { id: 3, text: "Hoy lo más importante recordarme es:", type: "text" },
  { id: 4, text: "¿Sentí resentimiento hoy?", type: "yesno" },
  { id: 5, text: "¿Estuve en contacto con mis sentimientos hoy?", type: "yesno" },
  { id: 6, text: "¿Me aislé hoy?", type: "yesno" },
  { id: 7, text: "¿Seguí mis valores diarios?", type: "yesno" },
  { id: 8, text: "¿Has hecho algo que crees que te limita en lugar de expandirte?", type: "yesno" },
  { id: 9, text: "¿Has tenido pensamientos negativos hoy?", type: "yesno" },
  { id: 10, text: "¿Cómo calificarías tu descanso ayer por la noche?", type: "scale" },
  { id: 11, text: "¿Has comido bien en cantidad y calidad?", type: "scale" },
  { id: 12, text: "¿Crees que te has movido lo suficiente?", type: "scale" },
];

export default function CheckIn() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [triggerDescription, setTriggerDescription] = useState("");
  const [resentmentDescription, setResentmentDescription] = useState("");
  const [valuesDescription, setValuesDescription] = useState("");
  const [limitingDescription, setLimitingDescription] = useState("");
  const [negativeThoughtsDescription, setNegativeThoughtsDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userValues, setUserValues] = useState<string[]>([]);
  const [showRelapseDialog, setShowRelapseDialog] = useState(false);
  const [relapseConfirmed, setRelapseConfirmed] = useState(false);
  const [userAddictions, setUserAddictions] = useState<UserAddiction[]>([]);
  const [selectedRelapseAddiction, setSelectedRelapseAddiction] = useState<string>("");

  useEffect(() => {
    const loadExistingCheckIn = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      const { data: checkIn } = await supabase
        .from('check_ins')
        .select('*')
        .eq('user_id', user.id)
        .eq('check_in_date', today)
        .maybeSingle();

      if (checkIn?.answers) {
        setAnswers(checkIn.answers as Record<number, string>);
        // Load trigger description if exists
        if ((checkIn.answers as any).trigger_description) {
          setTriggerDescription((checkIn.answers as any).trigger_description);
        }
        // Load resentment description if exists
        if ((checkIn.answers as any).resentment_description) {
          setResentmentDescription((checkIn.answers as any).resentment_description);
        }
        // Load values description if exists
        if ((checkIn.answers as any).values_description) {
          setValuesDescription((checkIn.answers as any).values_description);
        }
        // Load limiting description if exists
        if ((checkIn.answers as any).limiting_description) {
          setLimitingDescription((checkIn.answers as any).limiting_description);
        }
        // Load negative thoughts description if exists
        if ((checkIn.answers as any).negative_thoughts_description) {
          setNegativeThoughtsDescription((checkIn.answers as any).negative_thoughts_description);
        }
      }

      // Load user values
      const { data: values } = await supabase
        .from('values')
        .select('name')
        .eq('user_id', user.id);

      if (values) {
        setUserValues(values.map(v => v.name));
      }

      // Load user addictions
      const { data: profile } = await supabase
        .from('profiles')
        .select('rehabilitation_type')
        .eq('user_id', user.id)
        .single();

      const { data: addictions } = await supabase
        .from('addictions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      const allAddictions: UserAddiction[] = [];
      
      // Add original addiction from profile
      if (profile?.rehabilitation_type) {
        allAddictions.push({
          id: 'original',
          name: profile.rehabilitation_type,
          isOriginal: true
        });
      }

      // Add additional addictions
      if (addictions) {
        addictions.forEach(addiction => {
          allAddictions.push({
            id: addiction.id,
            name: addiction.addiction_type,
            isOriginal: false
          });
        });
      }

      setUserAddictions(allAddictions);
      
      console.log('Adicciones cargadas:', allAddictions);
      
      // Pre-select first addiction if available
      if (allAddictions.length > 0) {
        setSelectedRelapseAddiction(allAddictions[0].id);
      }
    };

    loadExistingCheckIn();
  }, []);

  const handleAnswer = (questionId: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    
    // Show relapse dialog if question 1 is answered "no"
    if (questionId === 1 && answer === "no") {
      setShowRelapseDialog(true);
      setRelapseConfirmed(false);
    }
  };

  const handleConfirmRelapse = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (!selectedRelapseAddiction) {
        toast({
          title: "Error",
          description: "Selecciona una adicción",
          variant: "destructive",
        });
        return;
      }

      // Reset the selected addiction's counter
      if (selectedRelapseAddiction === 'original') {
        // Reset original addiction in profiles
        const { error } = await supabase
          .from('profiles')
          .update({
            abstinence_start_date: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Reset additional addiction's start date
        const { error } = await supabase
          .from('addictions')
          .update({
            start_date: new Date().toISOString()
          })
          .eq('id', selectedRelapseAddiction)
          .eq('user_id', user.id);

        if (error) throw error;
      }

      setRelapseConfirmed(true);
      
      toast({
        title: "Contador reseteado",
        description: "El contador de esta adicción ha sido actualizado",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo resetear el contador",
        variant: "destructive",
      });
    }
  };

  const handleRelapseInventory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      // Create journal entry
      const { error: journalError } = await supabase
        .from('journal_entries')
        .insert({
          user_id: user.id,
          entry_date: today,
          title: "Inventario de la recaída",
          content: "",
          tags: ["recaída", "inventario"]
        });

      if (journalError) throw journalError;

      setShowRelapseDialog(false);
      setRelapseConfirmed(false);
      navigate('/journal');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el inventario",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para guardar el check-in",
          variant: "destructive",
        });
        return;
      }

      // Save check-in with trigger, values, and limiting descriptions
      // Use default text for question 3 if empty
      const finalAnswers = { ...answers };
      if (!finalAnswers[3] || finalAnswers[3].trim() === "") {
        finalAnswers[3] = "Lo mejor está por regar";
      }
      
      const answersWithDescriptions = {
        ...finalAnswers,
        trigger_description: triggerDescription,
        resentment_description: resentmentDescription,
        values_description: valuesDescription,
        limiting_description: limitingDescription,
        negative_thoughts_description: negativeThoughtsDescription
      };

      const { error: checkInError } = await supabase
        .from('check_ins')
        .upsert({
          user_id: user.id,
          check_in_date: new Date().toISOString().split('T')[0],
          answers: answersWithDescriptions,
        }, {
          onConflict: 'user_id,check_in_date'
        });

      if (checkInError) throw checkInError;

      const today = new Date().toISOString().split('T')[0];
      
      // Create comprehensive check-in journal entry
      const journalTitle = format(new Date(), "EEEE d MMM. yyyy", { locale: es })
        .replace(/^\w/, (c) => c.toUpperCase())
        .replace(/\b([a-z]{3})\./i, (match) => match.charAt(0).toUpperCase() + match.slice(1));
      
      // Build journal content with all text answers
      let journalContent = "";
      
      // Question 2 - trigger description
      if (answers[2] === "yes" && triggerDescription.trim()) {
        journalContent += `Situación que me alteró:\n${triggerDescription.trim()}\n\n• • •\n\n`;
      }
      
      // Question 4 - resentment description
      if (answers[4] === "yes" && resentmentDescription.trim()) {
        journalContent += `Resentimiento:\n${resentmentDescription.trim()}\n\n• • •\n\n`;
      }
      
      // Question 7 - values description
      if (answers[7] === "no" && valuesDescription.trim()) {
        journalContent += `Infidelidad a mis valores:\n${valuesDescription.trim()}\n\n• • •\n\n`;
      }
      
      // Question 8 - limiting description
      if (answers[8] === "yes" && limitingDescription.trim()) {
        journalContent += `Obstáculos a superar:\n${limitingDescription.trim()}\n\n• • •\n\n`;
      }
      
      // Question 9 - negative thoughts description
      if (answers[9] === "yes" && negativeThoughtsDescription.trim()) {
        journalContent += `Pensamientos negativos:\n${negativeThoughtsDescription.trim()}\n\n`;
      }
      
      // Remove trailing separator if present
      journalContent = journalContent.replace(/\n\n• • •\n\n$/, '');
      
      // Build tags array
      const journalTags = ["check-in", "observaciones"];
      if (answers[2] === "yes" && triggerDescription.trim()) {
        journalTags.push("situaciones");
      }
      if (answers[4] === "yes" && resentmentDescription.trim()) {
        journalTags.push("resentimientos");
      }
      if (answers[8] === "yes" && limitingDescription.trim()) {
        journalTags.push("limitaciones");
      }
      
      // Create or update the check-in journal entry
      if (journalContent.trim()) {
        const checkInTitle = `Check-in ${journalTitle}`;
        const { data: existingEntry } = await supabase
          .from('journal_entries')
          .select('id')
          .eq('user_id', user.id)
          .eq('entry_date', today)
          .eq('title', checkInTitle)
          .maybeSingle();

        if (existingEntry) {
          // Update existing entry
          const { error: journalError } = await supabase
            .from('journal_entries')
            .update({
              content: journalContent.trim(),
              tags: journalTags
            })
            .eq('id', existingEntry.id);

          if (journalError) {
            console.error("Error updating journal entry:", journalError);
          }
        } else {
          // Insert new entry
          const { error: journalError } = await supabase
            .from('journal_entries')
            .insert({
              user_id: user.id,
              entry_date: today,
              title: checkInTitle,
              content: journalContent.trim(),
              tags: journalTags
            });

          if (journalError) {
            console.error("Error inserting journal entry:", journalError);
          }
        }
      }

      toast({
        title: "Check-in guardado",
        description: "Tu progreso diario ha sido registrado exitosamente",
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el check-in",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-[35px] animate-in fade-in duration-500">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="md:hidden">Check-In</span>
            <span className="hidden md:inline">Check-In Diario</span>
            <span className="text-xl">👀</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), "EEEE, d MMM. yyyy", { locale: es })
              .replace(/^\w/, (c) => c.toUpperCase())
              .replace(/\b([a-z]{3})\./i, (match) => match.charAt(0).toUpperCase() + match.slice(1))}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {questions.map((question) => (
            <div key={question.id} className="space-y-3">
              <Label className="text-base font-medium text-foreground pl-4">
                {question.id}. {question.text}
              </Label>
              
              {question.type === "yesno" ? (
                <>
                  <div className="flex gap-3">
                    <Button
                      variant={answers[question.id] === "yes" ? "default" : "outline"}
                      className={`flex-1 ${answers[question.id] === "yes" && [1, 5, 7].includes(question.id) ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
                      onClick={() => handleAnswer(question.id, "yes")}
                    >
                      SÍ
                    </Button>
                    <Button
                      variant={answers[question.id] === "no" ? "default" : "outline"}
                      className={`flex-1 ${
                        answers[question.id] === "no" && question.id === 1 
                          ? "bg-red-600 hover:bg-red-700 text-white" 
                          : answers[question.id] === "no" && [2, 4, 6, 8, 9].includes(question.id) 
                          ? "bg-green-600 hover:bg-green-700 text-white" 
                          : ""
                      }`}
                      onClick={() => handleAnswer(question.id, "no")}
                    >
                      NO
                    </Button>
                  </div>
                  
                  {/* Show trigger description field if question 2 answered "yes" */}
                  {question.id === 2 && answers[2] === "yes" && (
                    <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <Label htmlFor="trigger-description" className="text-sm font-medium text-foreground pl-4">
                        Describe la situación sin juzgar:
                      </Label>
                      <Textarea
                        id="trigger-description"
                        placeholder="Cuenta tu versión de los hechos sin juzgar y cómo y dónde lo sentiste."
                        value={triggerDescription}
                        onChange={(e) => setTriggerDescription(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <p className="text-xs text-muted-foreground">
                        Esta descripción se guardará automáticamente como entrada en tu diario con el título "Gatillos emocionales"
                      </p>
                    </div>
                  )}

                  {/* Show resentment description field if question 4 answered "yes" */}
                  {question.id === 4 && answers[4] === "yes" && (
                    <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <Label htmlFor="resentment-description" className="text-sm font-medium text-foreground pl-4">
                        Describe tu resentimiento:
                      </Label>
                      <Textarea
                        id="resentment-description"
                        placeholder="¿Qué situación o persona causó este resentimiento? ¿Cómo te afectó?"
                        value={resentmentDescription}
                        onChange={(e) => setResentmentDescription(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <p className="text-xs text-muted-foreground">
                        Esta descripción se guardará automáticamente como entrada en tu diario con el título "Resentimientos"
                      </p>
                    </div>
                  )}

                  {/* Show values description field if question 7 answered "no" */}
                  {question.id === 7 && answers[7] === "no" && (
                    <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <Label htmlFor="values-description" className="text-sm font-medium text-foreground pl-4">
                        Describe la situación:
                      </Label>
                      <Textarea
                        id="values-description"
                        placeholder="A qué valor has sido infiel. Cómo y porqué has sido infiel. Cómo puedes enmendarlo."
                        value={valuesDescription}
                        onChange={(e) => setValuesDescription(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <p className="text-xs text-muted-foreground">
                        Esta descripción se guardará automáticamente como entrada en tu diario con el título "Cuándo soy infiel a mis valores"
                      </p>
                      {userValues.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {userValues.map((value, index) => (
                            <span key={index} className="text-sm text-red-500 font-medium">
                              {value}{index < userValues.length - 1 ? ',' : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Show limiting description field if question 8 answered "yes" */}
                  {question.id === 8 && answers[8] === "yes" && (
                    <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <Label htmlFor="limiting-description" className="text-sm font-medium text-foreground pl-4">
                        ¿Qué obstáculos hay que superar?
                      </Label>
                      <Textarea
                        id="limiting-description"
                        placeholder="Describe de forma concreta los obstáculos a superar"
                        value={limitingDescription}
                        onChange={(e) => setLimitingDescription(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                  )}

                  {/* Show negative thoughts description field if question 9 answered "yes" */}
                  {question.id === 9 && answers[9] === "yes" && (
                    <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <Label htmlFor="negative-thoughts-description" className="text-sm font-medium text-foreground pl-4">
                        Describe tus pensamientos negativos:
                      </Label>
                      <Textarea
                        id="negative-thoughts-description"
                        placeholder="¿Qué pensamientos negativos tuviste hoy?"
                        value={negativeThoughtsDescription}
                        onChange={(e) => setNegativeThoughtsDescription(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                  )}
                </>
              ) : question.type === "scale" ? (
                <div className="flex gap-2 justify-start">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <Button
                      key={num}
                      variant={answers[question.id] === String(num) ? "default" : "outline"}
                      className={`w-12 h-12 p-0 !rounded-full font-semibold text-base shadow-md transition-all ${
                        answers[question.id] === String(num)
                          ? num <= 4
                            ? "bg-orange-600 hover:bg-orange-700 text-white border-orange-600 shadow-orange-600/50 scale-110"
                            : num <= 7
                            ? "bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600 shadow-yellow-600/50 scale-110"
                            : "bg-green-600 hover:bg-green-700 text-white border-green-600 shadow-green-600/50 scale-110"
                          : "hover:scale-105 hover:shadow-lg"
                      }`}
                      onClick={() => handleAnswer(question.id, String(num))}
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              ) : (
                <Input
                  placeholder={question.id === 3 ? "Lo mejor está por regar" : "Escribe..."}
                  value={answers[question.id] || ""}
                  onChange={(e) => handleAnswer(question.id, e.target.value)}
                  className="text-sm lg:text-base"
                />
              )}
            </div>
          ))}

          <Button 
            className="w-full gap-2 text-lg py-6 mt-8 hover:bg-green-600"
            size="lg"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Guardando..." : "Enviar"}
            <ArrowRight className="h-5 w-5" />
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-accent/5 to-transparent border-accent/20">
        <CardContent className="p-6">
          <p className="text-center text-foreground/80">
            Los check-ins diarios te ayudan a mantener conciencia de tu estado emocional e identificar patrones en tu camino de recuperación.
          </p>
        </CardContent>
      </Card>

      <AlertDialog open={showRelapseDialog} onOpenChange={(open) => {
        setShowRelapseDialog(open);
        if (!open) {
          setRelapseConfirmed(false);
        }
      }}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className="text-left">Nada de culpa. ¡Seguimos!</AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              Las recaídas son parte del proceso. Lo importante es aprender de ellas.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            {userAddictions.length > 1 ? (
              <div className="space-y-2">
                <Label className="text-left">¿En qué adicción has tenido la recaída?</Label>
                <Select
                  value={selectedRelapseAddiction}
                  onValueChange={setSelectedRelapseAddiction}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona una adicción" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {userAddictions.map((addiction, index) => (
                      <SelectItem key={addiction.id} value={addiction.id}>
                        {index + 1}. {addiction.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground text-left">Total de adicciones: {userAddictions.length}</p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-left">Total de adicciones: {userAddictions.length}</p>
            )}
          </div>

          <div className="flex flex-col gap-2 w-full -mt-[20px]">
            <Button onClick={handleRelapseInventory} className="bg-secondary w-full justify-start">
              Inventario
            </Button>
            {!relapseConfirmed && (
              <Button onClick={handleConfirmRelapse} className="bg-primary w-full justify-start">
                Confirmar
              </Button>
            )}
            <Button onClick={() => {
              setShowRelapseDialog(false);
              setRelapseConfirmed(false);
            }} variant="outline" className="w-full justify-start">
              Cerrar
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
