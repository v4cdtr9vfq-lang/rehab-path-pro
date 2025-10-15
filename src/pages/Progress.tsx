import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, CheckCircle2, Circle } from "lucide-react";
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
  remaining: number;
}

interface ExpandedGoal {
  id: string;
  originalId: string;
  text: string;
  completed: boolean;
  goal_type: string;
  instanceIndex: number;
}

export default function ProgressPage() {
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [dailyGoals, setDailyGoals] = useState<ExpandedGoal[]>([]);
  const [weeklyGoals, setWeeklyGoals] = useState<ExpandedGoal[]>([]);
  const [monthlyGoals, setMonthlyGoals] = useState<ExpandedGoal[]>([]);
  const [currentTab, setCurrentTab] = useState('daily');
  const [overallProgress, setOverallProgress] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    calculateProgress();
  }, [currentTab, dailyGoals, weeklyGoals, monthlyGoals, hasCheckedInToday]);

  // Listen for goal updates from other components
  useEffect(() => {
    const handleGoalsUpdate = () => {
      fetchData();
    };

    window.addEventListener('goalsUpdated', handleGoalsUpdate);
    return () => window.removeEventListener('goalsUpdated', handleGoalsUpdate);
  }, []);

  // Get date key for localStorage
  const getDateKey = (date: Date) => {
    return `goals_completed_${date.toISOString().split('T')[0]}`;
  };

  // Get date range for context
  const getDateRange = (context: 'daily' | 'weekly' | 'monthly'): Date[] => {
    const dates: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (context === 'daily') {
      dates.push(today);
    } else if (context === 'weekly') {
      // Get current week (last 7 days including today)
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        dates.push(date);
      }
    } else if (context === 'monthly') {
      // Get current month days
      const year = today.getFullYear();
      const month = today.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        dates.push(new Date(year, month, day));
      }
    }
    return dates;
  };

  // Load completed instances from localStorage for a date range
  const loadCompletedInstancesForRange = (dates: Date[]): Set<string> => {
    const allCompleted = new Set<string>();
    dates.forEach(date => {
      const stored = localStorage.getItem(getDateKey(date));
      if (stored) {
        const completedIds = JSON.parse(stored);
        completedIds.forEach((id: string) => allCompleted.add(id));
      }
    });
    return allCompleted;
  };

  const expandGoals = (goals: Goal[], context: 'daily' | 'weekly' | 'monthly'): ExpandedGoal[] => {
    const dates = getDateRange(context);
    const completedInstances = loadCompletedInstancesForRange(dates);
    const expanded: ExpandedGoal[] = [];
    
    goals.forEach(g => {
      let instanceCount = g.remaining;
      
      // Multiply instances based on context for recurring goals
      if (g.goal_type === 'always' || g.goal_type === 'today') {
        if (context === 'weekly') {
          instanceCount = g.remaining * 7;
        } else if (context === 'monthly') {
          instanceCount = g.remaining * dates.length;
        }
      } else if (g.goal_type === 'week' && context === 'monthly') {
        // Weekly goals in monthly view: ~4 weeks
        instanceCount = g.remaining * 4;
      }
      
      for (let i = 0; i < instanceCount; i++) {
        const instanceId = `${g.id}-${i}`;
        expanded.push({
          id: instanceId,
          originalId: g.id,
          text: g.text,
          completed: completedInstances.has(instanceId),
          goal_type: g.goal_type,
          instanceIndex: i
        });
      }
    });
    return expanded;
  };

  // Group expanded goals by original ID and calculate percentage
  const groupGoalsByOriginal = (expandedGoals: ExpandedGoal[]) => {
    const grouped = new Map<string, { text: string; total: number; completed: number }>();
    
    expandedGoals.forEach(goal => {
      if (!grouped.has(goal.originalId)) {
        grouped.set(goal.originalId, { text: goal.text, total: 0, completed: 0 });
      }
      const group = grouped.get(goal.originalId)!;
      group.total++;
      if (goal.completed) group.completed++;
    });
    
    return Array.from(grouped.entries()).map(([id, data]) => ({
      id,
      text: data.text,
      total: data.total,
      completed: data.completed,
      percentage: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
    }));
  };

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
        const weekly = goals.filter(g => g.goal_type === 'week' || g.goal_type === 'always' || g.goal_type === 'today');
        const monthly = goals.filter(g => g.goal_type === 'month' || g.goal_type === 'always' || g.goal_type === 'today' || g.goal_type === 'week');

        setDailyGoals(expandGoals(daily, 'daily'));
        setWeeklyGoals(expandGoals(weekly, 'weekly'));
        setMonthlyGoals(expandGoals(monthly, 'monthly'));
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

  const GoalProgressBar = ({ goal }: { goal: { id: string; text: string; total: number; completed: number; percentage: number } }) => (
    <div className="space-y-2 p-4 rounded-xl bg-muted/50 border border-border/50">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold text-foreground">{goal.text}</span>
        <span className="text-sm font-bold text-primary">{goal.percentage}%</span>
      </div>
      <Progress value={goal.percentage} className="h-2.5 [&>div]:bg-green-500" />
      <div className="flex justify-between items-center mt-1">
        <span className="text-xs text-muted-foreground">
          {goal.completed} de {goal.total} completadas
        </span>
        <span className={`text-xs font-medium ${goal.percentage === 100 ? 'text-green-500' : 'text-muted-foreground'}`}>
          {goal.percentage === 100 ? '✓ Completada' : `${goal.total - goal.completed} restantes`}
        </span>
      </div>
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
              <div className="space-y-2 p-4 rounded-xl bg-muted/50 border border-border/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-foreground">Check-in Diario</span>
                  <span className="text-sm font-bold text-primary">{hasCheckedInToday ? '100' : '0'}%</span>
                </div>
                <Progress value={hasCheckedInToday ? 100 : 0} className="h-2.5 [&>div]:bg-green-500" />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-muted-foreground">Check-in de recuperación</span>
                  <span className={`text-xs font-medium ${hasCheckedInToday ? 'text-green-500' : 'text-muted-foreground'}`}>
                    {hasCheckedInToday ? '✓ Completado' : 'Pendiente'}
                  </span>
                </div>
              </div>
              
              {groupGoalsByOriginal(dailyGoals).map((goal) => (
                <GoalProgressBar key={goal.id} goal={goal} />
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
              {groupGoalsByOriginal(weeklyGoals).map((goal) => (
                <GoalProgressBar key={goal.id} goal={goal} />
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
              {groupGoalsByOriginal(monthlyGoals).map((goal) => (
                <GoalProgressBar key={goal.id} goal={goal} />
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
              <div className="space-y-2 p-4 rounded-xl bg-muted/50 border border-border/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-foreground">Check-in Diario</span>
                  <span className="text-sm font-bold text-primary">{hasCheckedInToday ? '100' : '0'}%</span>
                </div>
                <Progress value={hasCheckedInToday ? 100 : 0} className="h-2.5 [&>div]:bg-green-500" />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-muted-foreground">Check-in de recuperación</span>
                  <span className={`text-xs font-medium ${hasCheckedInToday ? 'text-green-500' : 'text-muted-foreground'}`}>
                    {hasCheckedInToday ? '✓ Completado' : 'Pendiente'}
                  </span>
                </div>
              </div>

              {/* Group all goals by original ID to show each unique goal once */}
              {(() => {
                const allGoals = [...dailyGoals, ...weeklyGoals, ...monthlyGoals];
                const uniqueGoals = allGoals.filter((goal, index, self) => 
                  self.findIndex(g => g.originalId === goal.originalId) === index
                );
                return groupGoalsByOriginal(uniqueGoals).map((goal) => (
                  <GoalProgressBar key={goal.id} goal={goal} />
                ));
              })()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
