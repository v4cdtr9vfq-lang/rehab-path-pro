import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface HelpQuestionRequest {
  question: string;
  userEmail: string;
  userName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, userEmail, userName }: HelpQuestionRequest = await req.json();

    console.log("Sending help question email to somos@felices.org", {
      userEmail,
      questionLength: question.length,
    });

    const emailResponse = await resend.emails.send({
      from: "RehabP <onboarding@resend.dev>",
      to: ["somos@felices.org"],
      replyTo: userEmail,
      subject: `Nueva pregunta de ayuda de ${userName || userEmail}`,
      html: `
        <h2>Nueva pregunta recibida</h2>
        <p><strong>Usuario:</strong> ${userName || "Sin nombre"}</p>
        <p><strong>Email:</strong> ${userEmail}</p>
        <hr />
        <h3>Pregunta:</h3>
        <p>${question}</p>
        <hr />
        <p><em>Para responder, puedes usar el botón "Responder" en tu cliente de correo.</em></p>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-help-question function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
