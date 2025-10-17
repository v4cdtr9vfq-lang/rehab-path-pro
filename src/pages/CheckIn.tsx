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

interface Question {
  id: number;
  text: string;
  type: "yesno" | "text";
}

const questions: Question[] = [
  { id: 1, text: "¿Estuve abstinente hoy?", type: "yesno" },
  { id: 2, text: "¿Encontré alguna situación que me provocara hoy?", type: "yesno" },
  { id: 3, text: "Hoy lo más importante recordarme es:", type: "text" },
  { id: 4, text: "¿Sentí resentimiento hoy?", type: "yesno" },
  { id: 5, text: "¿Fui honesto con mis sentimientos hoy?", type: "yesno" },
  { id: 6, text: "¿Me aislé hoy?", type: "yesno" },
  { id: 7, text: "¿Seguí mis valores diarios?", type: "yesno" },
];

export default function CheckIn() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [triggerDescription, setTriggerDescription] = useState("");
  const [valuesDescription, setValuesDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        // Load values description if exists
        if ((checkIn.answers as any).values_description) {
          setValuesDescription((checkIn.answers as any).values_description);
        }
      }
    };

    loadExistingCheckIn();
  }, []);

  const handleAnswer = (questionId: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
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

      // Save check-in with trigger and values descriptions
      const answersWithDescriptions = {
        ...answers,
        trigger_description: triggerDescription,
        values_description: valuesDescription
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

      // If answered "yes" to trigger question and has description, save as journal entry
      if (answers[2] === "yes" && triggerDescription.trim()) {
        const { error: journalError } = await supabase
          .from('journal_entries')
          .upsert({
            user_id: user.id,
            entry_date: today,
            title: "Gatillos emocionales",
            content: triggerDescription.trim(),
            tags: ["gatillos", "check-in"]
          }, {
            onConflict: 'user_id,entry_date,title'
          });

        if (journalError) {
          console.error("Error saving journal entry:", journalError);
        }
      }

      // If answered "no" to values question and has description, save as journal entry
      if (answers[7] === "no" && valuesDescription.trim()) {
        const { error: journalError } = await supabase
          .from('journal_entries')
          .upsert({
            user_id: user.id,
            entry_date: today,
            title: "Cuándo soy infiel a mis valores",
            content: valuesDescription.trim(),
            tags: ["valores", "check-in"]
          }, {
            onConflict: 'user_id,entry_date,title'
          });

        if (journalError) {
          console.error("Error saving journal entry:", journalError);
        }
      }

      toast({
        title: "¡Check-in guardado!",
        description: "Tu progreso diario ha sido registrado exitosamente",
      });

      navigate('/');
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Check-In Diario</h1>
        <p className="text-muted-foreground text-lg">Reflexiona sobre tu día y rastrea tu progreso</p>
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Resumen del Check-In Diario
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {questions.map((question) => (
            <div key={question.id} className="space-y-3">
              <Label className="text-base font-medium text-foreground">
                {question.id}. {question.text}
              </Label>
              
              {question.type === "yesno" ? (
                <>
                  <div className="flex gap-3">
                    <Button
                      variant={answers[question.id] === "yes" ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => handleAnswer(question.id, "yes")}
                    >
                      SÍ
                    </Button>
                    <Button
                      variant={answers[question.id] === "no" ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => handleAnswer(question.id, "no")}
                    >
                      NO
                    </Button>
                  </div>
                  
                  {/* Show trigger description field if question 2 answered "yes" */}
                  {question.id === 2 && answers[2] === "yes" && (
                    <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <Label htmlFor="trigger-description" className="text-sm font-medium text-foreground">
                        Describe la situación
                      </Label>
                      <Textarea
                        id="trigger-description"
                        placeholder="Describe qué situación te provocó y cómo te sentiste..."
                        value={triggerDescription}
                        onChange={(e) => setTriggerDescription(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <p className="text-xs text-muted-foreground">
                        Esta descripción se guardará automáticamente como entrada en tu diario con el título "Gatillos emocionales"
                      </p>
                    </div>
                  )}

                  {/* Show values description field if question 7 answered "no" */}
                  {question.id === 7 && answers[7] === "no" && (
                    <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <Label htmlFor="values-description" className="text-sm font-medium text-foreground">
                        Describe la situación
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
                    </div>
                  )}
                </>
              ) : (
                <Input
                  placeholder="Escribe..."
                  value={answers[question.id] || ""}
                  onChange={(e) => handleAnswer(question.id, e.target.value)}
                  className="text-base"
                />
              )}
            </div>
          ))}

          <Button 
            className="w-full gap-2 text-lg py-6 mt-8"
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
    </div>
  );
}
