import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendReportEmailRequest {
  recipientEmail: string;
  reportContent: string;
  reportPeriod: string;
  reportDate: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipientEmail, reportContent, reportPeriod, reportDate }: SendReportEmailRequest = await req.json();

    if (!recipientEmail || !reportContent) {
      return new Response(
        JSON.stringify({ error: "Faltan datos requeridos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!BREVO_API_KEY) {
      console.error("BREVO_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "La API key de Brevo no está configurada. Por favor, configúrala en los secretos del proyecto." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Sending report email to:", recipientEmail);

    const emailResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY || "",
      },
      body: JSON.stringify({
        sender: {
          name: "Informes de Progreso",
          email: "noreply@tudominio.com"
        },
        to: [
          {
            email: recipientEmail,
            name: recipientEmail
          }
        ],
        subject: `Informe de Progreso - ${reportPeriod}`,
        htmlContent: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 800px;
                  margin: 0 auto;
                  padding: 20px;
                  background-color: #f5f5f5;
                }
                .container {
                  background-color: white;
                  border-radius: 8px;
                  padding: 30px;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .header {
                  border-bottom: 2px solid #6366f1;
                  padding-bottom: 15px;
                  margin-bottom: 25px;
                }
                h1 {
                  color: #6366f1;
                  margin: 0;
                  font-size: 24px;
                }
                .meta {
                  color: #666;
                  font-size: 14px;
                  margin: 10px 0;
                }
                .content {
                  white-space: pre-wrap;
                  line-height: 1.8;
                }
                .footer {
                  margin-top: 30px;
                  padding-top: 20px;
                  border-top: 1px solid #eee;
                  color: #666;
                  font-size: 12px;
                  text-align: center;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Informe de Progreso Psicológico</h1>
                  <div class="meta">
                    <strong>Período:</strong> ${reportPeriod}<br>
                    <strong>Generado:</strong> ${reportDate}
                  </div>
                </div>
                <div class="content">
                  ${reportContent}
                </div>
                <div class="footer">
                  <p>Este informe ha sido generado automáticamente por tu aplicación de seguimiento de progreso personal.</p>
                  <p>Este correo es confidencial y está dirigido únicamente a su destinatario.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Brevo API error:", errorData);
      throw new Error(errorData.message || `Error del servidor de correo: ${emailResponse.status}`);
    }

    const data = await emailResponse.json();
    console.log("Email sent successfully:", data);

    return new Response(
      JSON.stringify({ success: true, messageId: data.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Error al enviar el correo" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
