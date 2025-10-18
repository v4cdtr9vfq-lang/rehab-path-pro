import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { HelpCircle } from "lucide-react";

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
  const [isAnonymous, setIsAnonymous] = useState(false);
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
        title: "Pregunta enviada",
        description: "Tu pregunta ha sido enviada. Los administradores la responderán pronto.",
      });

      setUserQuestion("");
      setIsAnonymous(false);
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
    <div className="container mx-auto px-4 pt-4 md:pt-0 md:-mt-[3px] pb-8 max-w-4xl space-y-[30px] animate-in fade-in duration-500">
      {/* FAQs Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-2xl">Preguntas Frecuentes</CardTitle>
          <HelpCircle className="h-6 w-6 text-red-500" />
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
        <CardHeader className="pb-0">
          <CardTitle className="text-xl">¿No encuentras lo que buscas?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-[15px]">
          <p className="text-sm text-muted-foreground">
            Envía tu pregunta y nuestros administradores te responderán lo antes posible.
          </p>
          <Textarea
            placeholder="Escribe tu pregunta aquí..."
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            className="min-h-[120px] resize-none text-sm"
            maxLength={500}
          />
          <Button
            onClick={handleSubmitQuestion}
            disabled={isSubmitting || !userQuestion.trim()}
            className="rounded-xl w-full"
          >
            {isSubmitting ? "Enviando..." : "Enviar pregunta"}
          </Button>
          <div className="flex items-center gap-2">
            <Switch
              id="anonymous-question"
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
            />
            <Label htmlFor="anonymous-question" className="text-sm text-muted-foreground cursor-pointer">
              Enviar de forma anónima
            </Label>
          </div>
          <div className="text-xs text-muted-foreground">
            {userQuestion.length}/500 caracteres
          </div>
        </CardContent>
      </Card>
    </div>
  );
}