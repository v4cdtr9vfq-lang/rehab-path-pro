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
    const { startDate, endDate, language = 'es' } = await req.json();
    
    if (!startDate || !endDate) {
      const errorMsg = language === 'es' 
        ? "Se requieren fechas de inicio y fin"
        : "Start and end dates are required";
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      const errorMsg = language === 'es' ? "No autorizado" : "Unauthorized";
      return new Response(
        JSON.stringify({ error: errorMsg }),
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
      const errorMsg = language === 'es' 
        ? "Error de configuración del servidor"
        : "Server configuration error";
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with anon key for authentication
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get user using the JWT token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error("User error:", userError);
      const errorMsg = language === 'es' ? "Usuario no autenticado" : "User not authenticated";
      return new Response(
        JSON.stringify({ error: errorMsg }),
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

    const systemPromptES = `Eres un psicólogo integrativo con amplia experiencia en análisis clínico y seguimiento terapéutico. Tu enfoque combina perspectivas humanistas, cognitivo-conductuales y sistémicas para ofrecer una comprensión holística del proceso de cambio del consultante.

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

    const systemPromptEN = `You are an integrative psychologist with extensive experience in clinical analysis and therapeutic monitoring. Your approach combines humanistic, cognitive-behavioral, and systemic perspectives to offer a holistic understanding of the client's change process.

Your task is to prepare a professional and detailed psychological report that includes:

1. EXECUTIVE SUMMARY
Overview of the analyzed period with the most relevant findings from the therapeutic process.

2. EMOTIONAL STATE EVOLUTION
Analysis of identified emotional patterns, including improvement trends, stability, or areas of difficulty. Identify emotional resources and observed coping strategies.

3. RECORDS AND PERSONAL NARRATIVE ANALYSIS
Insights derived from personal diary, daily check-ins, and gratitude exercises. Explore recurring themes, internal conflicts, and advances in self-awareness.

4. RISK FACTORS AND WARNING SIGNS
Identification of indicators requiring special attention or adjustments in therapeutic support.

5. PERSONAL RESOURCES AND STRENGTHS
Positive aspects, resilient capacities, and significant achievements observed during the period.

6. THERAPEUTIC RECOMMENDATIONS
Specific evidence-based suggestions to continue the change process, including behavioral strategies, reflection exercises, and priority work areas.

7. FOLLOW-UP PLAN
Key areas to monitor in future sessions and suggested therapeutic objectives for the next period.

IMPORTANT: Write the report in professional plain text. DO NOT use any formatting symbols like asterisks, hashtags, dashes, or any type of markup. Use only running text with line breaks to separate sections. Titles should be written in UPPERCASE without additional symbols.

The report should be:
- Professional, rigorous, and empathetic
- Based on clinical evidence derived from provided data
- Constructive and growth-oriented
- Specific, personalized, and respectful
- Written in formal but approachable English
- Without asterisks, hashtags, bold, italics, or any markdown formatting`;

    const userPromptES = `Analiza los siguientes datos del usuario para el período ${context.periodo}:

IMPORTANTE: Ignora completamente cualquier entrada que contenga únicamente la frase "Lo mejor está por regar" o "Lo mejor está por llegar", ya que es texto de placeholder por defecto y no representa contenido real del usuario.

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

Genera un informe completo de progreso psicológico y emocional, excluyendo cualquier referencia a las frases por defecto mencionadas.`;

    const userPromptEN = `Analyze the following user data for the period ${context.periodo}:

IMPORTANT: Completely ignore any entry that contains only the phrase "Lo mejor está por regar" or "Lo mejor está por llegar", as it is default placeholder text and does not represent actual user content.

RECORDED EMOTIONS (${context.emociones.length} entries):
${JSON.stringify(context.emociones, null, 2)}

DIARY ENTRIES (${context.diario.length} entries):
${JSON.stringify(context.diario, null, 2)}

GRATITUDE (${context.gratitud.length} entries):
${JSON.stringify(context.gratitud, null, 2)}

VALUES:
${JSON.stringify(context.valores, null, 2)}

DAILY CHECK-INS (${context.checkIns.length} entries):
${JSON.stringify(context.checkIns, null, 2)}

Generate a complete psychological and emotional progress report, excluding any reference to the default phrases mentioned.`;

    const systemPrompt = language === 'es' ? systemPromptES : systemPromptEN;
    const userPrompt = language === 'es' ? userPromptES : userPromptEN;

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
        const errorMsg = language === 'es'
          ? "Límite de solicitudes excedido. Por favor, intenta más tarde."
          : "Request limit exceeded. Please try again later.";
        return new Response(
          JSON.stringify({ error: errorMsg }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (aiResponse.status === 402) {
        const errorMsg = language === 'es'
          ? "Se requiere pago. Por favor, añade fondos a tu cuenta de Lovable AI."
          : "Payment required. Please add funds to your Lovable AI account.";
        return new Response(
          JSON.stringify({ error: errorMsg }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const errorMsg = language === 'es' ? "Error al generar el informe" : "Error generating report";
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const reportContent = aiData.choices?.[0]?.message?.content;

    if (!reportContent) {
      console.error("No content in AI response:", aiData);
      const errorMsg = language === 'es' 
        ? "No se pudo generar el contenido del informe"
        : "Could not generate report content";
      return new Response(
        JSON.stringify({ error: errorMsg }),
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
      const errorMsg = language === 'es' ? "Error al guardar el informe" : "Error saving report";
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Report saved successfully:", report.id);

    // Also save as journal entry
    const journalTitle = language === 'es'
      ? `Informe de Progreso: ${startDate} a ${endDate}`
      : `Progress Report: ${startDate} to ${endDate}`;
    const journalTags = language === 'es' ? ['informe', 'progreso'] : ['report', 'progress'];
    const { error: journalError } = await supabaseAdmin
      .from("journal_entries")
      .insert({
        user_id: user.id,
        title: journalTitle,
        content: reportContent,
        entry_date: new Date().toISOString().split('T')[0],
        tags: journalTags
      });

    if (journalError) {
      console.error("Journal insert error:", journalError);
      // Don't fail the whole operation if journal insert fails
    } else {
      console.log("Report also saved to journal");
    }

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
    const errorMsg = error instanceof Error ? error.message : "Error desconocido";
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});