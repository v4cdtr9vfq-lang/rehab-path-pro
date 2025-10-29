import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { startDate, endDate } = await req.json();
    
    if (!startDate || !endDate) {
      return new Response(
        JSON.stringify({ error: "Se requieren fechas de inicio y fin" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract JWT token from Authorization header
    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey || !lovableApiKey) {
      console.error("Missing environment variables");
      return new Response(
        JSON.stringify({ error: "Error de configuración del servidor" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with anon key for authentication
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get user using the JWT token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error("User error:", userError);
      return new Response(
        JSON.stringify({ error: "Usuario no autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Generating report for user:", user.id, "from", startDate, "to", endDate);

    // Create admin client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Gather all user data
    const [emotionData, journalData, gratitudeData, valuesData, checkInData] = await Promise.all([
      supabaseAdmin.from("emotion_journal").select("*")
        .eq("user_id", user.id)
        .gte("entry_date", startDate)
        .lte("entry_date", endDate),
      
      supabaseAdmin.from("journal_entries").select("*")
        .eq("user_id", user.id)
        .gte("entry_date", startDate)
        .lte("entry_date", endDate),
      
      supabaseAdmin.from("gratitude_entries").select("*")
        .eq("user_id", user.id)
        .gte("entry_date", startDate)
        .lte("entry_date", endDate),
      
      supabaseAdmin.from("values").select("*")
        .eq("user_id", user.id),
      
      supabaseAdmin.from("check_ins").select("*")
        .eq("user_id", user.id)
        .gte("check_in_date", startDate)
        .lte("check_in_date", endDate)
    ]);

    console.log("Data collected:", {
      emotions: emotionData.data?.length || 0,
      journals: journalData.data?.length || 0,
      gratitude: gratitudeData.data?.length || 0,
      values: valuesData.data?.length || 0,
      checkIns: checkInData.data?.length || 0
    });

    // Prepare context for AI
    const context = {
      periodo: `${startDate} a ${endDate}`,
      emociones: emotionData.data || [],
      diario: journalData.data || [],
      gratitud: gratitudeData.data || [],
      valores: valuesData.data || [],
      checkIns: checkInData.data || []
    };

    const systemPrompt = `Eres un psicólogo integrativo con amplia experiencia en análisis clínico y seguimiento terapéutico. Tu enfoque combina perspectivas humanistas, cognitivo-conductuales y sistémicas para ofrecer una comprensión holística del proceso de cambio del consultante.

Tu tarea es elaborar un informe psicológico profesional y detallado que incluya:

1. RESUMEN EJECUTIVO
Visión general del período analizado con los hallazgos más relevantes del proceso terapéutico.

2. EVOLUCIÓN DEL ESTADO EMOCIONAL
Análisis de los patrones emocionales identificados, incluyendo tendencias de mejora, estabilidad o áreas de dificultad. Identificar recursos emocionales y estrategias de afrontamiento observadas.

3. ANÁLISIS DE REGISTROS Y NARRATIVA PERSONAL
Insights derivados del diario personal, check-ins diarios y ejercicios de gratitud. Explorar temas recurrentes, conflictos internos, y avances en la autoconciencia.

4. FACTORES DE RIESGO Y SEÑALES DE ALERTA
Identificación de indicadores que requieren atención especial o ajustes en el acompañamiento terapéutico.

5. RECURSOS Y FORTALEZAS PERSONALES
Aspectos positivos, capacidades resilientes y logros significativos observados durante el período.

6. RECOMENDACIONES TERAPÉUTICAS
Sugerencias específicas basadas en evidencia para continuar el proceso de cambio, incluyendo estrategias conductuales, ejercicios de reflexión y áreas de trabajo prioritarias.

7. PLAN DE SEGUIMIENTO
Áreas clave a monitorear en futuras sesiones y objetivos terapéuticos sugeridos para el siguiente período.

IMPORTANTE: Redacta el informe en texto plano profesional. NO uses ningún símbolo de formato como asteriscos, almohadillas, guiones, ni ningún tipo de marcado. Usa únicamente texto corrido con saltos de línea para separar secciones. Los títulos deben escribirse en mayúsculas sin símbolos adicionales.

El informe debe ser:
- Profesional, riguroso y empático
- Basado en evidencia clínica derivada de los datos proporcionados
- Constructivo y orientado al crecimiento personal
- Específico, personalizado y respetuoso
- Redactado en español formal pero cercano
- Sin asteriscos, almohadillas, negritas, cursivas ni ningún formato markdown`;

    const userPrompt = `Analiza los siguientes datos del usuario para el período ${context.periodo}:

EMOCIONES REGISTRADAS (${context.emociones.length} entradas):
${JSON.stringify(context.emociones, null, 2)}

ENTRADAS DE DIARIO (${context.diario.length} entradas):
${JSON.stringify(context.diario, null, 2)}

GRATITUD (${context.gratitud.length} entradas):
${JSON.stringify(context.gratitud, null, 2)}

VALORES:
${JSON.stringify(context.valores, null, 2)}

CHECK-INS DIARIOS (${context.checkIns.length} entradas):
${JSON.stringify(context.checkIns, null, 2)}

Genera un informe completo de progreso psicológico y emocional.`;

    console.log("Calling Lovable AI...");

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de solicitudes excedido. Por favor, intenta más tarde." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Se requiere pago. Por favor, añade fondos a tu cuenta de Lovable AI." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Error al generar el informe" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const reportContent = aiData.choices?.[0]?.message?.content;

    if (!reportContent) {
      console.error("No content in AI response:", aiData);
      return new Response(
        JSON.stringify({ error: "No se pudo generar el contenido del informe" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Report generated, saving to database...");

    // Save report to database using admin client
    const { data: report, error: insertError } = await supabaseAdmin
      .from("progress_reports")
      .insert({
        user_id: user.id,
        start_date: startDate,
        end_date: endDate,
        report_content: reportContent
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Error al guardar el informe" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Report saved successfully:", report.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        report: report 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});