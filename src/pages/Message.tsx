import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, RefreshCw } from "lucide-react";

export default function Message() {
  const quotes = [
    {
      text: "Siempre es lo simple lo que produce lo maravilloso.",
      author: "Amelia Barr"
    },
    {
      text: "La confianza se construye con consistencia.",
      author: "Lincoln Chafee"
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Mensaje Diario</h1>
        <p className="text-muted-foreground text-lg">Inspiración y sabiduría para tu camino</p>
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <MessageSquare className="h-6 w-6 text-primary" />
            Mensaje de Hoy
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {quotes.map((quote, i) => (
            <blockquote key={i} className="border-l-4 border-primary pl-6 py-2">
              <p className="text-xl italic text-foreground/90 mb-3">
                "{quote.text}"
              </p>
              <footer className="text-muted-foreground">
                — {quote.author}
              </footer>
            </blockquote>
          ))}
        </CardContent>
      </Card>

      <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
        <CardContent className="p-6">
          <h3 className="font-semibold text-foreground mb-3">💡 Reflexión del Día</h3>
          <p className="text-foreground/80">
            ¿Cómo puedes practicar la simplicidad en tu recuperación hoy? ¿Qué pequeña acción consistente puedes tomar 
            para construir confianza contigo mismo y con los demás?
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Obtener Otro Mensaje
        </Button>
      </div>
    </div>
  );
}
