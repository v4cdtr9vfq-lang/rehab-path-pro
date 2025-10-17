import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wind, Anchor, Phone, AlertCircle, HeartPulse } from "lucide-react";
import { Link } from "react-router-dom";

export default function Tools() {
  const tools = [
    {
      icon: Wind,
      title: "Ejercicio de respiración",
      description: "Calma tu mente con técnicas de respiración guiada",
      color: "text-sky-blue",
      bgColor: "bg-sky-blue/10"
    },
    {
      icon: Anchor,
      title: "Ejercicio de Anclaje",
      description: "Conéctate con el momento presente usando la técnica 5-4-3-2-1",
      color: "text-sky-blue",
      bgColor: "bg-sky-blue/10"
    },
    {
      icon: AlertCircle,
      title: "Plan de Crisis",
      description: "Tu plan personalizado para momentos difíciles",
      color: "text-destructive",
      bgColor: "bg-destructive/10"
    },
    {
      icon: HeartPulse,
      title: "Menú de Autocuidado",
      description: "Actividades rápidas para apoyar tu bienestar",
      color: "text-sky-blue",
      bgColor: "bg-sky-blue/10"
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Herramientas</h1>
        <p className="text-muted-foreground text-lg">Recursos para apoyarte en momentos desafiantes</p>
      </div>

      <Card className="border-destructive/30 bg-gradient-to-br from-destructive/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-2">¿En Crisis?</h3>
              <p className="text-sm text-foreground/80 mb-4">
                Si estás en peligro inmediato o experimentando una crisis, por favor busca ayuda inmediatamente.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="destructive" className="gap-2">
                  <Phone className="h-4 w-4" />
                  Llamar línea de crisis
                </Button>
                <Link to="/support-network">
                  <Button variant="outline" className="w-full sm:w-auto">
                    Ver Mi Red de Apoyo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {tools.map((tool, index) => {
          const Icon = tool.icon;
          return (
            <Card
              key={index}
              className="border-primary/20 hover:shadow-medium transition-all duration-300 hover:-translate-y-1 cursor-pointer"
            >
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${tool.bgColor}`}>
                    <Icon className={`h-6 w-6 ${tool.color}`} />
                  </div>
                  <CardTitle className="text-xl">{tool.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/80">{tool.description}</p>
              </CardContent>
            </Card>
          );
        })}

        {/* Mi red de apoyo card with link to dedicated page */}
        <Link to="/support-network" className="md:col-span-2">
          <Card className="border-primary/20 hover:shadow-medium transition-all duration-300 hover:-translate-y-1 cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-sky-blue/10">
                  <Phone className="h-6 w-6 text-sky-blue" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl">Mi red de apoyo</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Gestiona tus contactos de confianza para momentos difíciles
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
