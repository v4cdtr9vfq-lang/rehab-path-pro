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

    // Set up realtime subscription for goal completions
    const channel = supabase
      .channel('progress_goal_completions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goal_completions'
        },
        async () => {
          // Use a small delay to batch multiple rapid changes
          setTimeout(() => {
            fetchData();
          }, 300);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    calculateProgress();
  }, [currentTab, dailyGoals, weeklyGoals, monthlyGoals, hasCheckedInToday]);

  // Get local date string without UTC conversion
  const getLocalDateString = (date: Date = new Date()): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get date key for localStorage
  const getDateKey = (date: Date) => {
    return `goals_completed_${getLocalDateString(date)}`;
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

  // Load completed instances from database for a date range
  const loadCompletedInstancesForRange = async (dates: Date[]): Promise<Set<string>> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return new Set();

      const dateStrings = dates.map(d => getLocalDateString(d));

      const { data, error } = await supabase
        .from('goal_completions')
        .select('goal_id, instance_index, completion_date')
        .eq('user_id', user.id)
        .in('completion_date', dateStrings);

      if (error) throw error;

      const completedSet = new Set<string>();
      data?.forEach(completion => {
        const instanceId = `${completion.goal_id}__${completion.completion_date}__${completion.instance_index}`;
        completedSet.add(instanceId);
      });

      return completedSet;
    } catch (error) {
      console.error('Error loading completions for range:', error);
      return new Set();
    }
  };

  const expandGoals = async (goals: Goal[], context: 'daily' | 'weekly' | 'monthly'): Promise<ExpandedGoal[]> => {
    const dates = getDateRange(context);
    const expanded: ExpandedGoal[] = [];
    
    // Load all completions for the date range at once
    const allCompletedInstances = await loadCompletedInstancesForRange(dates);
    
    goals.forEach(g => {
      if (g.goal_type === 'onetime') {
        // One-time goals: simple expansion for daily view only
        if (context === 'daily') {
          const todayStr = getLocalDateString();
          for (let i = 0; i < g.remaining; i++) {
            const instanceId = `${g.id}__${todayStr}__${i}`;
            expanded.push({
              id: instanceId,
              originalId: g.id,
              text: g.text,
              completed: allCompletedInstances.has(instanceId),
              goal_type: g.goal_type,
              instanceIndex: i
            });
          }
        }
      } else {
        // Recurring goals: create instances per day
        dates.forEach((date, dayIndex) => {
          const dateStr = getLocalDateString(date);
          
          // How many instances per day based on goal type
          let instancesPerDay = g.remaining;
          if (g.goal_type === 'week' && context === 'monthly') {
            // Weekly goals in monthly view: only on week boundaries
            if (dayIndex % 7 === 0) {
              for (let i = 0; i < g.remaining; i++) {
                const instanceId = `${g.id}__${dateStr}__${i}`;
                expanded.push({
                  id: instanceId,
                  originalId: g.id,
                  text: g.text,
                  completed: allCompletedInstances.has(instanceId),
                  goal_type: g.goal_type,
                  instanceIndex: dayIndex * g.remaining + i
                });
              }
            }
          } else {
            // Daily/weekly goals: create instances for each applicable day
            for (let i = 0; i < instancesPerDay; i++) {
              const instanceId = `${g.id}__${dateStr}__${i}`;
              expanded.push({
                id: instanceId,
                originalId: g.id,
                text: g.text,
                completed: allCompletedInstances.has(instanceId),
                goal_type: g.goal_type,
                instanceIndex: dayIndex * g.remaining + i
              });
            }
          }
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

        setDailyGoals(await expandGoals(daily, 'daily'));
        setWeeklyGoals(await expandGoals(weekly, 'weekly'));
        setMonthlyGoals(await expandGoals(monthly, 'monthly'));
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
        <span className={`text-sm font-bold ${goal.percentage === 100 ? 'text-green-500' : 'text-primary'}`}>{goal.percentage}%</span>
      </div>
      <Progress value={goal.percentage} className={`h-2.5 ${goal.percentage === 100 ? '[&>div]:bg-green-500' : '[&>div]:bg-primary'}`} />
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
            Progreso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <div className={`inline-flex items-center justify-center w-40 h-40 rounded-full border-8 ${overallProgress === 100 ? 'border-green-500/30 bg-green-500/5' : 'border-primary/20 bg-card'} transition-colors duration-500`}>
              <span className={`text-4xl font-bold ${overallProgress === 100 ? 'text-green-500' : 'text-primary'} transition-colors duration-500`}>{overallProgress}%</span>
            </div>
            <p className="text-sm text-muted-foreground mt-4">Completitud Total de Metas</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="daily" className="w-full" onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily">Diario</TabsTrigger>
          <TabsTrigger value="week">Semana Actual</TabsTrigger>
          <TabsTrigger value="month">Mes Actual</TabsTrigger>
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
                  <span className={`text-sm font-bold ${hasCheckedInToday ? 'text-green-500' : 'text-primary'}`}>{hasCheckedInToday ? '100' : '0'}%</span>
                </div>
                <Progress value={hasCheckedInToday ? 100 : 0} className={`h-2.5 ${hasCheckedInToday ? '[&>div]:bg-green-500' : '[&>div]:bg-primary'}`} />
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

      </Tabs>
    </div>
  );
}
