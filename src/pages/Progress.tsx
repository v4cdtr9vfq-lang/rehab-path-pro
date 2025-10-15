import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp } from "lucide-react";

interface ProgressArea {
  name: string;
  percentage: number;
  color: string;
}

export default function ProgressPage() {
  const areas: ProgressArea[] = [
    { name: "Participación en Recuperación", percentage: 0, color: "bg-primary" },
    { name: "Físico", percentage: 0, color: "bg-primary" },
    { name: "Emocional", percentage: 0, color: "bg-primary" },
    { name: "Relaciones", percentage: 0, color: "bg-primary" },
    { name: "Práctico", percentage: 0, color: "bg-primary" },
    { name: "Espiritual", percentage: 0, color: "bg-accent" },
  ];

  const ProgressBar = ({ area }: { area: ProgressArea }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-foreground">{area.name}</span>
        <span className="text-sm font-bold text-primary">{area.percentage}%</span>
      </div>
      <Progress value={area.percentage} className="h-2" />
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Progreso</h1>
        <p className="text-muted-foreground text-lg">Rastrea tu camino de recuperación en diferentes áreas</p>
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <TrendingUp className="h-6 w-6 text-primary" />
            Progreso General
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-8 border-primary/20 bg-card">
              <span className="text-4xl font-bold text-primary">0%</span>
            </div>
            <p className="text-sm text-muted-foreground mt-4">Completitud Total de Metas</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="week" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="week">Semana Actual</TabsTrigger>
          <TabsTrigger value="month">Mes Actual</TabsTrigger>
          <TabsTrigger value="overall">General</TabsTrigger>
        </TabsList>
        
        <TabsContent value="week" className="space-y-6 mt-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Progreso Semanal por Área</CardTitle>
              <p className="text-sm text-muted-foreground">
                Sin datos aún
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {areas.map((area) => (
                <ProgressBar key={area.name} area={area} />
              ))}
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Historial de Check-In Diario</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p>No hay check-ins registrados aún</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="month" className="space-y-6 mt-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Progreso Mensual por Área</CardTitle>
              <p className="text-sm text-muted-foreground">
                Sin datos aún
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {areas.map((area) => (
                <ProgressBar key={area.name} area={area} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overall" className="space-y-6 mt-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Progreso General</CardTitle>
              <p className="text-sm text-muted-foreground">
                Sin datos aún
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {areas.map((area) => (
                <ProgressBar key={area.name} area={area} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
