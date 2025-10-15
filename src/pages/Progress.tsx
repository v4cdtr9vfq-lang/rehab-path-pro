import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProgressArea {
  name: string;
  percentage: number;
  color: string;
}

export default function ProgressPage() {
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);

  useEffect(() => {
    checkTodayCheckIn();
  }, []);

  const checkTodayCheckIn = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('check_ins')
        .select('id')
        .eq('user_id', user.id)
        .eq('check_in_date', today)
        .maybeSingle();

      setHasCheckedInToday(!!data);
    } catch (error) {
      console.error('Error checking check-in:', error);
    }
  };

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

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="daily">Diario</TabsTrigger>
          <TabsTrigger value="week">Semana Actual</TabsTrigger>
          <TabsTrigger value="month">Mes Actual</TabsTrigger>
          <TabsTrigger value="overall">General</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-6 mt-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Progreso Diario</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg bg-card/50 hover:bg-card transition-colors">
                <div className="flex items-center gap-3">
                  <CheckCircle 
                    className={`h-6 w-6 ${hasCheckedInToday ? 'text-green-500' : 'text-destructive'}`} 
                  />
                  <span className="text-foreground font-medium">Recuperación</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {hasCheckedInToday ? 'Completado hoy' : 'Pendiente'}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
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
