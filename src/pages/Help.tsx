import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { HelpCircle, Send } from "lucide-react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  view_count: number;
  created_at: string;
}

export default function Help() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [filteredFaqs, setFilteredFaqs] = useState<FAQ[]>([]);
  const [filter, setFilter] = useState<"recent" | "popular">("popular");
  const [userQuestion, setUserQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadFAQs();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [filter, faqs]);

  const loadFAQs = async () => {
    try {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .order("view_count", { ascending: false });

      if (error) throw error;
      setFaqs(data || []);
    } catch (error) {
      console.error("Error loading FAQs:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las preguntas frecuentes.",
        variant: "destructive",
      });
    }
  };

  const applyFilter = () => {
    if (!faqs.length) return;

    let sorted = [...faqs];
    if (filter === "popular") {
      sorted.sort((a, b) => b.view_count - a.view_count);
    } else {
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    setFilteredFaqs(sorted);
  };

  const handleSubmitQuestion = async () => {
    if (!userQuestion.trim()) {
      toast({
        title: "Error",
        description: "Por favor escribe tu pregunta.",
        variant: "destructive",
      });
      return;
    }

    if (userQuestion.length > 500) {
      toast({
        title: "Error",
        description: "La pregunta no puede exceder 500 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para enviar preguntas.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("user_questions")
        .insert({
          user_id: user.id,
          question: userQuestion.trim(),
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "¡Pregunta enviada!",
        description: "Tu pregunta ha sido enviada. Los administradores la responderán pronto.",
      });

      setUserQuestion("");
    } catch (error: any) {
      console.error("Error submitting question:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar tu pregunta.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const incrementViewCount = async (faqId: string) => {
    try {
      const faq = faqs.find(f => f.id === faqId);
      if (!faq) return;

      await supabase
        .from("faqs")
        .update({ view_count: faq.view_count + 1 })
        .eq("id", faqId);

      setFaqs(prev => prev.map(f => 
        f.id === faqId ? { ...f, view_count: f.view_count + 1 } : f
      ));
    } catch (error) {
      console.error("Error updating view count:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-6">
        <HelpCircle className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">Centro de Ayuda</h1>
      </div>

      {/* FAQs Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Preguntas Frecuentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as "recent" | "popular")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="popular">Populares</TabsTrigger>
              <TabsTrigger value="recent">Recientes</TabsTrigger>
            </TabsList>

            <TabsContent value="popular" className="mt-6">
              <Accordion type="single" collapsible className="w-full">
                {filteredFaqs.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id}>
                    <AccordionTrigger 
                      onClick={() => incrementViewCount(faq.id)}
                      className="text-left hover:text-primary"
                    >
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>

            <TabsContent value="recent" className="mt-6">
              <Accordion type="single" collapsible className="w-full">
                {filteredFaqs.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id}>
                    <AccordionTrigger 
                      onClick={() => incrementViewCount(faq.id)}
                      className="text-left hover:text-primary"
                    >
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Ask a Question Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">¿No encuentras lo que buscas?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Envía tu pregunta y nuestros administradores te responderán lo antes posible.
          </p>
          <Textarea
            placeholder="Escribe tu pregunta aquí..."
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            className="min-h-[120px]"
            maxLength={500}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {userQuestion.length}/500 caracteres
            </span>
            <Button
              onClick={handleSubmitQuestion}
              disabled={isSubmitting || !userQuestion.trim()}
              className="rounded-xl"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? "Enviando..." : "Enviar pregunta"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}