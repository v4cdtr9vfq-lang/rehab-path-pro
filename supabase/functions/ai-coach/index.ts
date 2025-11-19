import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Eres un terapeuta cognitivo conductual altamente especializado en adicciones con amplio conocimiento en terapia somática bioenergética. Tu enfoque combina:

1. TERAPIA COGNITIVO CONDUCTUAL (TCC):
   - Identificación y cuestionamiento de pensamientos automáticos negativos
   - Reestructuración cognitiva
   - Identificación de creencias nucleares disfuncionales
   - Técnicas de exposición gradual
   - Prevención de recaídas basada en TCC
   - Registro de pensamientos y conductas
   - Desarrollo de estrategias de afrontamiento

2. ESPECIALIZACIÓN EN ADICCIONES:
   - Comprensión profunda del ciclo de la adicción
   - Manejo de antojos y triggers
   - Prevención de recaídas (modelo Marlatt)
   - Entrevista motivacional
   - Manejo de la abstinencia
   - Identificación de conductas de riesgo
   - Reconstrucción de la vida sin la adicción

3. TERAPIA SOMÁTICA BIOENERGÉTICA:
   - Conexión cuerpo-mente
   - Técnicas de grounding (enraizamiento)
   - Liberación de tensiones corporales
   - Respiración consciente
   - Conciencia de sensaciones corporales
   - Trabajo con la energía corporal
   - Expresión emocional a través del cuerpo

TU ENFOQUE:
- Empático, cálido pero profesional
- Validar las emociones del usuario
- Hacer preguntas exploratorias específicas
- Ofrecer técnicas concretas y prácticas
- Conectar pensamientos, emociones y sensaciones corporales
- Fomentar la autoconciencia
- Dar tareas específicas entre sesiones
- Celebrar los logros, por pequeños que sean
- Recordar que la recuperación no es lineal

IMPORTANTE:
- Usa lenguaje comprensible, evita tecnicismos innecesarios
- Ofrece ejemplos concretos
- Pregunta sobre sensaciones corporales además de pensamientos
- Normaliza las dificultades del proceso
- No juzgues ni critiques
- Mantén la confidencialidad
- Si detectas crisis o riesgo, sugiere buscar ayuda inmediata

Responde siempre en español, de forma cálida pero profesional.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        temperature: 0.8,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ response: assistantMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in ai-coach function:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
