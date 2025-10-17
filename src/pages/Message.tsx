import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Star, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Quote {
  text: string;
  author: string;
}

interface SavedQuote {
  id: string;
  quote_text: string;
  quote_author: string;
  saved_date: string;
}

export default function Message() {
  const { toast } = useToast();
  const [dailyQuote, setDailyQuote] = useState<Quote | null>(null);
  const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>([]);
  const [isSaved, setIsSaved] = useState(false);

  const allQuotes: Quote[] = [
    { text: "Siempre es lo simple lo que produce lo maravilloso.", author: "Amelia Barr" },
    { text: "La confianza se construye con consistencia.", author: "Lincoln Chafee" },
    { text: "Un viaje de mil millas comienza con un solo paso.", author: "Lao Tzu" },
    { text: "La valentía no es la ausencia del miedo, sino el triunfo sobre él.", author: "Nelson Mandela" },
    { text: "El éxito es la suma de pequeños esfuerzos repetidos día tras día.", author: "Robert Collier" },
    { text: "No cuentes los días, haz que los días cuenten.", author: "Muhammad Ali" },
    { text: "La recuperación no es un destino, es un viaje.", author: "Anónimo" },
    { text: "Cada día es una nueva oportunidad para comenzar de nuevo.", author: "Desconocido" },
    { text: "La fuerza no viene de lo que puedes hacer. Viene de superar las cosas que creías que no podías hacer.", author: "Rikki Rogers" },
    { text: "El primer paso no te lleva donde quieres ir, pero te saca de donde estás.", author: "Anónimo" }
  ];

  const reflections = [
    "¿Cómo puedes practicar la simplicidad en tu recuperación hoy? ¿Qué pequeña acción consistente puedes tomar para construir confianza contigo mismo y con los demás?",
    "¿Qué obstáculo te está deteniendo hoy? ¿Cómo puedes transformarlo en una oportunidad de crecimiento?",
    "¿Qué cosa pequeña puedes hacer hoy para cuidar mejor de ti mismo?",
    "¿A quién puedes agradecer hoy por su apoyo en tu camino de recuperación?",
    "¿Qué has aprendido sobre ti mismo en los últimos días? ¿Cómo puedes aplicar esa lección hoy?",
    "¿Qué te hace sentir más fuerte en tu recuperación? ¿Cómo puedes incorporar más de eso en tu día?",
    "¿Qué significa para ti el progreso hoy? ¿Cómo lo vas a medir?",
    "¿Qué cosa puedes perdonarte hoy? ¿Qué paso puedes dar hacia adelante?"
  ];

  // Get quote of the day based on date
  const getQuoteOfTheDay = () => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    return allQuotes[dayOfYear % allQuotes.length];
  };

  // Get reflection of the day based on date
  const getReflectionOfTheDay = () => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    return reflections[dayOfYear % reflections.length];
  };

  useEffect(() => {
    setDailyQuote(getQuoteOfTheDay());
    loadSavedQuotes();
  }, []);

  useEffect(() => {
    if (dailyQuote) {
      checkIfSaved();
    }
  }, [dailyQuote, savedQuotes]);

  const loadSavedQuotes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('saved_quotes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedQuotes(data || []);
    } catch (error: any) {
      console.error('Error loading saved quotes:', error);
    }
  };

  const checkIfSaved = () => {
    if (!dailyQuote) return;
    const saved = savedQuotes.some(
      sq => sq.quote_text === dailyQuote.text && sq.quote_author === dailyQuote.author
    );
    setIsSaved(saved);
  };

  const toggleSaveQuote = async () => {
    if (!dailyQuote) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para guardar frases",
          variant: "destructive",
        });
        return;
      }

      if (isSaved) {
        // Remove from saved
        const quoteToRemove = savedQuotes.find(
          sq => sq.quote_text === dailyQuote.text && sq.quote_author === dailyQuote.author
        );
        
        if (quoteToRemove) {
          const { error } = await supabase
            .from('saved_quotes')
            .delete()
            .eq('id', quoteToRemove.id);

          if (error) throw error;

          toast({
            title: "Frase eliminada",
            description: "La frase ha sido eliminada de tus guardados",
          });
        }
      } else {
        // Add to saved
        const { error } = await supabase
          .from('saved_quotes')
          .insert({
            user_id: user.id,
            quote_text: dailyQuote.text,
            quote_author: dailyQuote.author
          });

        if (error) throw error;

        toast({
          title: "Frase guardada",
          description: "La frase ha sido guardada exitosamente",
        });
      }

      await loadSavedQuotes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo guardar la frase",
        variant: "destructive",
      });
    }
  };

  const deleteSavedQuote = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_quotes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Frase eliminada",
        description: "La frase ha sido eliminada de tus guardados",
      });

      await loadSavedQuotes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la frase",
        variant: "destructive",
      });
    }
  };

  if (!dailyQuote) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Frase del Día</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSaveQuote}
              className="h-10 w-10"
            >
              <Star className={`h-5 w-5 ${isSaved ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </CardHeader>
        <CardContent>
          <blockquote className="border-l-4 border-primary pl-6 py-2">
            <p className="text-xl italic text-foreground/90 mb-3">
              "{dailyQuote.text}"
            </p>
            <footer className="text-muted-foreground">
              — {dailyQuote.author}
            </footer>
          </blockquote>
        </CardContent>
      </Card>

      <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
        <CardContent className="p-6">
          <h3 className="font-semibold text-foreground mb-3">💡 Reflexión del Día</h3>
          <p className="text-foreground/80">
            {getReflectionOfTheDay()}
          </p>
        </CardContent>
      </Card>

      {savedQuotes.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-xl">Frases Guardadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {savedQuotes.map((quote) => (
              <div key={quote.id} className="flex items-start justify-between p-4 rounded-lg bg-muted/30 border border-border/30">
                <blockquote className="flex-1">
                  <p className="text-base italic text-foreground/90 mb-2">
                    "{quote.quote_text}"
                  </p>
                  <footer className="text-sm text-muted-foreground">
                    — {quote.quote_author}
                  </footer>
                </blockquote>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteSavedQuote(quote.id)}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
