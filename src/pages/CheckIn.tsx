import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Calendar } from "lucide-react";
import { useState } from "react";
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
  { id: 3, text: "Hoy lo más importante recordarme es", type: "text" },
  { id: 4, text: "¿Sentí resentimiento hoy?", type: "yesno" },
  { id: 5, text: "¿Fui honesto con mis sentimientos hoy?", type: "yesno" },
  { id: 6, text: "¿Me aislé hoy?", type: "yesno" },
  { id: 7, text: "¿Seguí mis valores diarios?", type: "yesno" },
];

export default function CheckIn() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [feelingWords, setFeelingWords] = useState(["Cómodo", "Confiado"]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      const { error } = await supabase
        .from('check_ins')
        .upsert({
          user_id: user.id,
          check_in_date: new Date().toISOString().split('T')[0],
          answers: answers,
        }, {
          onConflict: 'user_id,check_in_date'
        });

      if (error) throw error;

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
              ) : (
                <div className="space-y-2">
                  <Input
                    placeholder="Escribe una palabra..."
                    value={answers[question.id] || ""}
                    onChange={(e) => handleAnswer(question.id, e.target.value)}
                    className="text-base"
                  />
                  <div className="flex flex-wrap gap-2">
                    {feelingWords.map((word, i) => (
                      <Button
                        key={i}
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAnswer(question.id, word)}
                      >
                        {word}
                      </Button>
                    ))}
                  </div>
                </div>
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
