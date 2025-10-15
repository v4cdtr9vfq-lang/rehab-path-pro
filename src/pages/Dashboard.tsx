import { AbstinenceCounter } from "@/components/AbstinenceCounter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, ClipboardCheck, Phone, Wind, BookOpen, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Home() {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const checkInCompleted = false;
  const todayEmotion = "Esperanzado";
  const goalsCompleted = 0;
  const totalGoals = 0;
  const goalsProgress = totalGoals > 0 ? (goalsCompleted / totalGoals) * 100 : 0;

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('abstinence_start_date')
          .eq('user_id', user.id)
          .single();
        
        if (profile?.abstinence_start_date) {
          setStartDate(new Date(profile.abstinence_start_date));
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  // Active goals for today/week
  const activeGoals: any[] = [];

  // Quick tools - configurable
  const quickTools = [
    { icon: Wind, label: "Respiración guiada", path: "/tools", color: "text-primary" },
    { icon: Phone, label: "Contacto de apoyo", path: "/message", color: "text-accent" },
    { icon: BookOpen, label: "Diario", path: "/journal", color: "text-primary" },
    { icon: AlertCircle, label: "Plan de emergencia", path: "/tools", color: "text-destructive" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header - Abstinence Counter */}
      <AbstinenceCounter startDate={startDate} />

      {/* Daily Progress Panel */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Progreso Diario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Goals Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-muted-foreground">Metas completadas hoy</p>
              <p className="text-sm font-bold text-primary">{goalsCompleted} de {totalGoals}</p>
            </div>
            <Progress value={goalsProgress} className="h-3" />
          </div>

          {/* Daily Check-In Status */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/50">
            <div className="flex items-center gap-3">
              {checkInCompleted ? (
                <CheckCircle2 className="h-6 w-6 text-primary" />
              ) : (
                <Clock className="h-6 w-6 text-muted-foreground" />
              )}
              <div>
                <p className="font-semibold text-foreground">Check-In Diario</p>
                {checkInCompleted ? (
                  <p className="text-sm text-muted-foreground">Completado ✅</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Pendiente ⏱️</p>
                )}
              </div>
            </div>
            {!checkInCompleted && (
              <Link to="/checkin">
                <Button size="sm" className="rounded-xl">Registrar</Button>
              </Link>
            )}
          </div>

          {/* Today's Emotion */}
          {checkInCompleted && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Emoción principal del día</p>
                <p className="text-lg font-semibold text-primary">{todayEmotion}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Goals Summary */}
      <Card className="bg-secondary/80 border-secondary">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold text-secondary-foreground">Metas Activas</CardTitle>
          <Link to="/plan">
            <Button variant="ghost" size="sm" className="text-secondary-foreground hover:bg-secondary-foreground/10">Ver todas</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {activeGoals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-secondary-foreground/70 mb-4">No tienes metas activas aún</p>
              <Link to="/plan">
                <Button className="rounded-xl bg-secondary-foreground text-secondary hover:bg-secondary-foreground/90">
                  <Target className="h-4 w-4 mr-2" />
                  Añadir meta
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activeGoals.slice(0, 3).map((goal) => (
                <div
                  key={goal.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-secondary-foreground/20 bg-card hover:bg-secondary-foreground/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {goal.status === "completed" ? (
                      <CheckCircle2 className="h-5 w-5 text-secondary-foreground flex-shrink-0" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-secondary-foreground/50 flex-shrink-0" />
                    )}
                    <div>
                      <p className={`font-medium ${goal.status === "completed" ? "line-through text-secondary-foreground/60" : "text-secondary-foreground"}`}>
                        {goal.title}
                      </p>
                      <p className="text-xs text-secondary-foreground/60">{goal.period}</p>
                    </div>
                  </div>
                  <Badge variant={goal.status === "completed" ? "default" : "outline"} className="text-xs">
                    {goal.status === "completed" ? "Completada" : "Pendiente"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Tools */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-foreground">Herramientas Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.label} to={tool.path}>
                <Card className="hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-pointer bg-accent/80 border-accent h-full">
                  <CardContent className="p-5 text-center space-y-3">
                    <div className="mx-auto w-12 h-12 rounded-2xl bg-accent-foreground/10 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-accent-foreground" />
                    </div>
                    <p className="font-semibold text-accent-foreground text-xs leading-tight">{tool.label}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Daily Motivational Message */}
      <Card className="bg-[hsl(var(--warning))] border-[hsl(var(--warning))]">
        <CardContent className="p-6">
          <p className="text-center text-warning-foreground text-xl font-medium leading-relaxed mb-2">
            "La confianza se construye con consistencia."
          </p>
          <p className="text-center text-warning-foreground/70 text-sm">- Lincoln Chafee</p>
          <div className="flex justify-center mt-4">
            <Link to="/message">
              <Button variant="ghost" size="sm" className="text-warning-foreground hover:bg-warning-foreground/10 text-xs">Ver más mensajes</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
