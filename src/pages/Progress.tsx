import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { TrendingUp, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProgressArea {
  name: string;
  percentage: number;
  color: string;
}

interface Goal {
  id: string;
  text: string;
  completed: boolean;
  goal_type: string;
}

export default function ProgressPage() {
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [dailyGoals, setDailyGoals] = useState<Goal[]>([]);
  const [weeklyGoals, setWeeklyGoals] = useState<Goal[]>([]);
  const [monthlyGoals, setMonthlyGoals] = useState<Goal[]>([]);
  const [currentTab, setCurrentTab] = useState('daily');
  const [overallProgress, setOverallProgress] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    calculateProgress();
  }, [currentTab, dailyGoals, weeklyGoals, monthlyGoals, hasCheckedInToday]);

  const calculateProgress = () => {
    let completed = 0;
    let total = 0;

    if (currentTab === 'daily') {
      completed = (hasCheckedInToday ? 1 : 0) + dailyGoals.filter(g => g.completed).length;
      total = 1 + dailyGoals.length;
    } else if (currentTab === 'week') {
      completed = weeklyGoals.filter(g => g.completed).length;
      total = weeklyGoals.length;
    } else if (currentTab === 'month') {
      completed = monthlyGoals.filter(g => g.completed).length;
      total = monthlyGoals.length;
    } else if (currentTab === 'overall') {
      const allGoals = [...dailyGoals, ...weeklyGoals, ...monthlyGoals];
      completed = (hasCheckedInToday ? 1 : 0) + allGoals.filter(g => g.completed).length;
      total = 1 + allGoals.length;
    }

    setOverallProgress(total > 0 ? Math.round((completed / total) * 100) : 0);
  };

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check today's check-in
      const today = new Date().toISOString().split('T')[0];
      const { data: checkIn } = await supabase
        .from('check_ins')
        .select('id')
        .eq('user_id', user.id)
        .eq('check_in_date', today)
        .maybeSingle();

      setHasCheckedInToday(!!checkIn);

      // Fetch all goals
      const { data: goals } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id);

      if (goals) {
        const daily = goals.filter(g => g.goal_type === 'today' || g.goal_type === 'always');
        const weekly = goals.filter(g => g.goal_type === 'week' || g.goal_type === 'always');
        const monthly = goals.filter(g => g.goal_type === 'month' || g.goal_type === 'always');

        setDailyGoals(daily);
        setWeeklyGoals(weekly);
        setMonthlyGoals(monthly);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
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
              <span className="text-4xl font-bold text-primary">{overallProgress}%</span>
            </div>
            <p className="text-sm text-muted-foreground mt-4">Completitud Total de Metas</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="daily" className="w-full" onValueChange={setCurrentTab}>
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
            <CardContent className="space-y-3">
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
              
              {dailyGoals.map((goal) => (
                <div key={goal.id} className="flex items-center justify-between p-4 rounded-lg bg-card/50 hover:bg-card transition-colors">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={goal.completed} disabled />
                    <span className={`text-foreground font-medium ${goal.completed ? 'line-through opacity-60' : ''}`}>
                      {goal.text}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {goal.completed ? 'Completado' : 'Pendiente'}
                  </span>
                </div>
              ))}

              {dailyGoals.length === 0 && (
                <p className="text-center py-4 text-muted-foreground">No hay metas para hoy</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="week" className="space-y-6 mt-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Progreso Semanal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {weeklyGoals.map((goal) => (
                <div key={goal.id} className="flex items-center justify-between p-4 rounded-lg bg-card/50 hover:bg-card transition-colors">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={goal.completed} disabled />
                    <span className={`text-foreground font-medium ${goal.completed ? 'line-through opacity-60' : ''}`}>
                      {goal.text}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {goal.completed ? 'Completado' : 'Pendiente'}
                  </span>
                </div>
              ))}

              {weeklyGoals.length === 0 && (
                <p className="text-center py-4 text-muted-foreground">No hay metas para esta semana</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="month" className="space-y-6 mt-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Progreso Mensual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {monthlyGoals.map((goal) => (
                <div key={goal.id} className="flex items-center justify-between p-4 rounded-lg bg-card/50 hover:bg-card transition-colors">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={goal.completed} disabled />
                    <span className={`text-foreground font-medium ${goal.completed ? 'line-through opacity-60' : ''}`}>
                      {goal.text}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {goal.completed ? 'Completado' : 'Pendiente'}
                  </span>
                </div>
              ))}

              {monthlyGoals.length === 0 && (
                <p className="text-center py-4 text-muted-foreground">No hay metas para este mes</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overall" className="space-y-6 mt-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Todas las Metas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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

              {[...dailyGoals, ...weeklyGoals, ...monthlyGoals]
                .filter((goal, index, self) => self.findIndex(g => g.id === goal.id) === index)
                .map((goal) => (
                  <div key={goal.id} className="flex items-center justify-between p-4 rounded-lg bg-card/50 hover:bg-card transition-colors">
                    <div className="flex items-center gap-3">
                      <Checkbox checked={goal.completed} disabled />
                      <span className={`text-foreground font-medium ${goal.completed ? 'line-through opacity-60' : ''}`}>
                        {goal.text}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {goal.completed ? 'Completado' : 'Pendiente'}
                    </span>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
