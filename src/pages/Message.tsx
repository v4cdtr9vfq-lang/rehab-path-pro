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
  const [dailyReflection, setDailyReflection] = useState<string>("");
  const [isSaved, setIsSaved] = useState(false);
  const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>([]);

  const quotes: Quote[] = [
    { text: "Siempre es lo simple lo que produce lo maravilloso.", author: "Amelia Barr" },
    { text: "La confianza se construye con consistencia.", author: "Lincoln Chafee" },
    { text: "El primer paso hacia el cambio es la conciencia. El segundo es la aceptación.", author: "Nathaniel Branden" },
    { text: "La recuperación es un proceso, no un evento.", author: "Anónimo" },
    { text: "No se trata de ser perfecto, se trata de progresar.", author: "Anónimo" },
    { text: "La valentía no siempre ruge. A veces la valentía es la voz al final del día que dice: Lo intentaré de nuevo mañana.", author: "Mary Anne Radmacher" },
    { text: "Un día a la vez es suficiente. No mires hacia atrás ni te preocupes por el futuro.", author: "Alcohólicos Anónimos" },
    { text: "La gratitud convierte lo que tenemos en suficiente.", author: "Melody Beattie" },
  ];

  const reflections: string[] = [
    "¿Cómo puedes practicar la simplicidad en tu recuperación hoy? ¿Qué pequeña acción consistente puedes tomar para construir confianza contigo mismo y con los demás?",
    "¿Qué puedes aceptar hoy que has estado resistiendo? ¿Cómo puedes ser más consciente de tus pensamientos y emociones?",
    "¿Qué progreso has hecho esta semana, por pequeño que sea? Reconoce tus logros.",
    "¿Qué desafío enfrentaste recientemente? ¿Qué aprendiste de esa experiencia?",
    "¿Por qué tres cosas estás agradecido hoy? ¿Cómo puedes expresar esa gratitud?",
    "¿Qué necesitas soltar hoy para avanzar en tu camino de recuperación?",
    "¿Cómo puedes ser más amable contigo mismo hoy? ¿Qué acto de autocuidado puedes realizar?",
  ];

  // Get quote of the day based on date
  const getQuoteOfDay = () => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    return quotes[dayOfYear % quotes.length];
  };

  // Get reflection of the day based on date
  const getReflectionOfDay = () => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    return reflections[dayOfYear % reflections.length];
  };

  // Check if current quote is saved
  const checkIfSaved = async (quote: Quote) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('saved_quotes')
        .select('id')
        .eq('user_id', user.id)
        .eq('quote_text', quote.text)
        .maybeSingle();

      if (error) throw error;
      setIsSaved(!!data);
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };

  // Load saved quotes
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
    } catch (error) {
      console.error('Error loading saved quotes:', error);
    }
  };

  // Save/unsave quote
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
        const { error } = await supabase
          .from('saved_quotes')
          .delete()
          .eq('user_id', user.id)
          .eq('quote_text', dailyQuote.text);

        if (error) throw error;

        setIsSaved(false);
        toast({
          title: "Frase eliminada",
          description: "La frase ha sido eliminada de tus favoritos",
        });
      } else {
        // Save quote
        const { error } = await supabase
          .from('saved_quotes')
          .insert({
            user_id: user.id,
            quote_text: dailyQuote.text,
            quote_author: dailyQuote.author,
          });

        if (error) throw error;

        setIsSaved(true);
        toast({
          title: "Frase guardada",
          description: "La frase ha sido añadida a tus favoritos",
        });
      }

      loadSavedQuotes();
    } catch (error: any) {
      console.error('Error toggling save:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la frase",
        variant: "destructive",
      });
    }
  };

  // Delete saved quote
  const deleteSavedQuote = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_quotes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Frase eliminada",
        description: "La frase ha sido eliminada de tus favoritos",
      });

      loadSavedQuotes();
      
      // Check if daily quote needs to update its saved status
      if (dailyQuote) {
        checkIfSaved(dailyQuote);
      }
    } catch (error) {
      console.error('Error deleting saved quote:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la frase",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const quote = getQuoteOfDay();
    const reflection = getReflectionOfDay();
    setDailyQuote(quote);
    setDailyReflection(reflection);
    checkIfSaved(quote);
    loadSavedQuotes();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Mensaje Diario</h1>
        <p className="text-muted-foreground text-lg">Inspiración y sabiduría para tu camino</p>
      </div>

      {dailyQuote && (
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
                <Star
                  className={`h-5 w-5 ${isSaved ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`}
                />
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
      )}

      <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
        <CardContent className="p-6">
          <h3 className="font-semibold text-foreground mb-3">💡 Reflexión del Día</h3>
          <p className="text-foreground/80">
            {dailyReflection}
          </p>
        </CardContent>
      </Card>

      {savedQuotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Frases Guardadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {savedQuotes.map((saved) => (
              <div
                key={saved.id}
                className="border-l-4 border-primary/50 pl-6 py-3 bg-muted/30 rounded-r-lg flex items-start justify-between gap-4"
              >
                <blockquote className="flex-1">
                  <p className="text-base italic text-foreground/90 mb-2">
                    "{saved.quote_text}"
                  </p>
                  <footer className="text-sm text-muted-foreground">
                    — {saved.quote_author}
                  </footer>
                </blockquote>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteSavedQuote(saved.id)}
                  className="h-8 w-8 flex-shrink-0"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
