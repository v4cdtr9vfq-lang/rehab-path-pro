import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const AiCoach = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('ai_coach_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const loadedMessages: Message[] = data.map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content
        }));
        setMessages(loadedMessages);
      } else {
        // Si no hay historial, mostrar mensaje de bienvenida
        setMessages([{
          role: "assistant",
          content: "Hola! Estoy aquí para apoyarte en tu proceso de recuperación. ¿Cómo llevas el proceso?"
        }]);
      }
    } catch (error) {
      console.error("Error cargando historial:", error);
      // En caso de error, mostrar mensaje de bienvenida
      setMessages([{
        role: "assistant",
        content: "Hola! Estoy aquí para apoyarte en tu proceso de recuperación. ¿Cómo llevas el proceso?"
      }]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const saveMessage = async (message: Message) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('ai_coach_messages').insert({
        user_id: user.id,
        role: message.role,
        content: message.content
      });
    } catch (error) {
      console.error("Error guardando mensaje:", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Guardar mensaje del usuario
    await saveMessage(userMessage);

    try {
      const { data, error } = await supabase.functions.invoke("ai-coach", {
        body: { messages: [...messages, userMessage] }
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        if (data.error.includes("Rate limits exceeded")) {
          toast({
            title: "Límite de uso alcanzado",
            description: "Has alcanzado el límite de mensajes. Por favor, intenta de nuevo más tarde.",
            variant: "destructive"
          });
        } else if (data.error.includes("Payment required")) {
          toast({
            title: "Fondos insuficientes",
            description: "Es necesario añadir fondos a tu cuenta para continuar usando el AI Coach.",
            variant: "destructive"
          });
        } else {
          throw new Error(data.error);
        }
        setIsLoading(false);
        return;
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Guardar mensaje del asistente
      await saveMessage(assistantMessage);
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje. Por favor, intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="h-[calc(100vh-8rem)] flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-2xl font-bold">🤖 AI Coach</h1>
          <p className="text-sm text-muted-foreground pl-[5px]">
            Inteligencia basada en Gemini 3 entrenada en tratamiento de adicciones.
          </p>
        </div>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {isLoadingHistory ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Escribe tu mensaje..."
              className="min-h-[60px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              size="icon"
              className="h-[60px] w-[60px]"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AiCoach;
