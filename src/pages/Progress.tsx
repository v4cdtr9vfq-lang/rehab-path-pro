import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Circle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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
  const [weeklyChartData, setWeeklyChartData] = useState<any[]>([]);
  const [monthlyChartData, setMonthlyChartData] = useState<any[]>([]);
  const [yearlyChartData, setYearlyChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
    calculateChartData();

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
            calculateChartData();
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

  const calculateChartData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Calcular datos semanales (últimos 7 días de lunes a domingo)
      const weekData = [];
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = domingo, 1 = lunes, etc.
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Días desde el lunes más reciente
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - daysToMonday + i);
        const dateStr = getLocalDateString(date);
        
        // Obtener todas las metas del día
        const { data: goals } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', user.id)
          .or('goal_type.eq.today,goal_type.eq.always');

        // Obtener completadas
        const { data: completions } = await supabase
          .from('goal_completions')
          .select('*')
          .eq('user_id', user.id)
          .eq('completion_date', dateStr);

        const totalGoals = goals?.length || 0;
        const completedGoals = completions?.length || 0;
        const percentage = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

        const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
        weekData.push({
          name: dayName.charAt(0).toUpperCase() + dayName.slice(1),
          progreso: percentage,
          isComplete: percentage === 100
        });
      }
      setWeeklyChartData(weekData);

      // Calcular datos mensuales (últimas 4 semanas)
      const monthData = [];
      for (let i = 3; i >= 0; i--) {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - (i * 7));
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 6);

        const { data: completions } = await supabase
          .from('goal_completions')
          .select('*')
          .eq('user_id', user.id)
          .gte('completion_date', getLocalDateString(startDate))
          .lte('completion_date', getLocalDateString(endDate));

        const { data: goals } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', user.id);

        const totalGoals = (goals?.length || 0) * 7;
        const completedGoals = completions?.length || 0;
        const percentage = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

        monthData.push({
          name: `Sem ${4 - i}`,
          progreso: percentage,
          isComplete: percentage === 100
        });
      }
      setMonthlyChartData(monthData);

      // Calcular datos anuales (enero a diciembre del año actual)
      const yearData = [];
      const currentYear = new Date().getFullYear();
      
      for (let month = 1; month <= 12; month++) {
        const { data: completions } = await supabase
          .from('goal_completions')
          .select('*')
          .eq('user_id', user.id)
          .gte('completion_date', `${currentYear}-${month.toString().padStart(2, '0')}-01`)
          .lt('completion_date', `${currentYear}-${(month + 1).toString().padStart(2, '0')}-01`);

        const { data: goals } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', user.id);

        const daysInMonth = new Date(currentYear, month, 0).getDate();
        const totalGoals = (goals?.length || 0) * daysInMonth;
        const completedGoals = completions?.length || 0;
        const percentage = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

        const date = new Date(currentYear, month - 1);
        const monthName = date.toLocaleDateString('es-ES', { month: 'short' });
        yearData.push({
          name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
          progreso: percentage,
          isComplete: percentage === 100
        });
      }
      setYearlyChartData(yearData);
    } catch (error) {
      console.error('Error calculating chart data:', error);
    }
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
        <span className={`text-sm font-bold ${goal.percentage === 100 ? 'text-green-500' : 'text-sky-blue'}`}>{goal.percentage}%</span>
      </div>
      <Progress value={goal.percentage} className={`h-2.5 ${goal.percentage === 100 ? '[&>div]:bg-green-500' : '[&>div]:bg-sky-blue'}`} />
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
      <Card className="border-sky-blue/40 bg-gradient-to-br from-sky-blue/15 to-sky-blue/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <span className="text-2xl">📈</span>
            {currentTab === 'daily' && 'Progreso hoy'}
            {currentTab === 'week' && 'Progreso semanal'}
            {currentTab === 'month' && 'Progreso mensual'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <div className={`inline-flex items-center justify-center w-40 h-40 rounded-full border-8 ${overallProgress === 100 ? 'border-green-500/30 bg-green-500/5' : 'border-sky-blue/30 bg-sky-blue/10'} transition-colors duration-500`}>
              <span className={`text-4xl font-bold ${overallProgress === 100 ? 'text-green-500' : 'text-sky-blue'} transition-colors duration-500`}>{overallProgress}%</span>
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
              <CardTitle className="flex items-center gap-2">
                <span className="text-lg">📈</span>
                Progreso hoy
              </CardTitle>
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
              <CardTitle className="flex items-center gap-2">
                <span className="text-lg">📈</span>
                Progreso semanal
              </CardTitle>
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
              <CardTitle className="flex items-center gap-2">
                <span className="text-lg">📈</span>
                Progreso mensual
              </CardTitle>
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

      {/* Chart Widget */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            Gráfico del progreso:
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="week" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 [&>button]:hover:bg-muted/30 [&>button]:transition-colors">
              <TabsTrigger value="week">Semana</TabsTrigger>
              <TabsTrigger value="month">Mes</TabsTrigger>
              <TabsTrigger value="year">Año</TabsTrigger>
            </TabsList>

            <TabsContent value="week" className="mt-18">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: any) => `${value}%`}
                    />
                    <Bar 
                      dataKey="progreso" 
                      radius={[8, 8, 0, 0]}
                      fill="hsl(var(--primary))"
                    >
                      {weeklyChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.isComplete ? '#22c55e' : 'hsl(var(--primary))'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="month" className="mt-18">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: any) => `${value}%`}
                    />
                    <Bar 
                      dataKey="progreso" 
                      radius={[8, 8, 0, 0]}
                      fill="hsl(var(--primary))"
                    >
                      {monthlyChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.isComplete ? '#22c55e' : 'hsl(var(--primary))'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="year" className="mt-18">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: any) => `${value}%`}
                    />
                    <Bar 
                      dataKey="progreso" 
                      radius={[8, 8, 0, 0]}
                      fill="hsl(var(--primary))"
                    >
                      {yearlyChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.isComplete ? '#22c55e' : 'hsl(var(--primary))'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
