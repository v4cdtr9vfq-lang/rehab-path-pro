import { AbstinenceCounter } from "@/components/AbstinenceCounter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Clock, Circle } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [checkInCompleted, setCheckInCompleted] = useState(false);
  const [todayReminder, setTodayReminder] = useState("");
  const [goalsCompleted, setGoalsCompleted] = useState(0);
  const [totalGoals, setTotalGoals] = useState(0);
  const goalsProgress = totalGoals > 0 ? (goalsCompleted / totalGoals) * 100 : 0;
  const [activeGoals, setActiveGoals] = useState<any[]>([]);

  // Get local date string without UTC conversion
  const getLocalDateString = (date: Date = new Date()): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Load completed instances from database
  const loadCompletedInstances = async (date: string): Promise<Set<string>> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return new Set();

      const { data, error } = await supabase
        .from('goal_completions')
        .select('goal_id, instance_index')
        .eq('user_id', user.id)
        .eq('completion_date', date);

      if (error) throw error;

      const completedSet = new Set<string>();
      data?.forEach(completion => {
        const instanceId = `${completion.goal_id}__${date}__${completion.instance_index}`;
        completedSet.add(instanceId);
      });

      return completedSet;
    } catch (error) {
      console.error('Error loading completions:', error);
      return new Set();
    }
  };

  // Save completion to database
  const saveCompletion = async (goalId: string, instanceIndex: number, date: string, isCompleted: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (isCompleted) {
        // Add completion
        await supabase
          .from('goal_completions')
          .insert({
            user_id: user.id,
            goal_id: goalId,
            completion_date: date,
            instance_index: instanceIndex
          });
      } else {
        // Remove completion
        await supabase
          .from('goal_completions')
          .delete()
          .eq('user_id', user.id)
          .eq('goal_id', goalId)
          .eq('completion_date', date)
          .eq('instance_index', instanceIndex);
      }
      // Realtime will handle the update automatically
    } catch (error) {
      console.error('Error saving completion:', error);
      throw error;
    }
  };

  const toggleGoal = async (goalId: string) => {
    try {
      const goal = activeGoals.find(g => g.id === goalId);
      if (!goal) return;

      const todayStr = getLocalDateString();
      const wasCompleted = goal.status === 'completed';

      // Optimistically update UI immediately
      const updatedGoals = activeGoals.map(g => 
        g.id === goalId 
          ? { ...g, status: wasCompleted ? 'pending' : 'completed' }
          : g
      );

      setActiveGoals(updatedGoals);

      // Recalculate completed count
      const totalCompletedToday = updatedGoals.filter(g => g.status === 'completed').length;
      setGoalsCompleted(totalCompletedToday + (checkInCompleted ? 1 : 0));

      // Save to database (realtime will sync to other devices)
      await saveCompletion(goal.originalId, goal.instanceIndex, todayStr, !wasCompleted);

      // Update database: mark goal as completed only if ALL instances are done
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const instancesOfThisGoal = updatedGoals.filter(g => g.originalId === goal.originalId);
      const completedInstancesOfGoal = instancesOfThisGoal.filter(g => g.status === 'completed').length;
      const allInstancesCompleted = completedInstancesOfGoal === instancesOfThisGoal.length;

      await supabase
        .from('goals')
        .update({ completed: allInstancesCompleted })
        .eq('id', goal.originalId)
        .eq('user_id', user.id);

      toast({
        title: "Meta actualizada",
        description: wasCompleted ? "Meta marcada como pendiente" : "¡Meta completada!",
      });
    } catch (error: any) {
      console.error('Error in toggleGoal:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la meta",
        variant: "destructive",
      });
      // Revert optimistic update on error
      const todayStr = getLocalDateString();
      const completedInstances = await loadCompletedInstances(todayStr);
      const revertedGoals = activeGoals.map(g => ({
        ...g,
        status: completedInstances.has(g.id) ? 'completed' : 'pending'
      }));
      setActiveGoals(revertedGoals);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('abstinence_start_date')
        .eq('user_id', user.id)
        .single();
      
      if (profile?.abstinence_start_date) {
        setStartDate(new Date(profile.abstinence_start_date));
      }

      // Fetch today's check-in
      const today = new Date().toISOString().split('T')[0];
      const { data: checkIn } = await supabase
        .from('check_ins')
        .select('*')
        .eq('user_id', user.id)
        .eq('check_in_date', today)
        .maybeSingle();

      if (checkIn) {
        setCheckInCompleted(true);
        const reminder = checkIn.answers['3'];
        if (reminder) setTodayReminder(reminder);
      }

      // Fetch today's goals (including 'always' type)
      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (goals && goals.length > 0) {
        // Filter goals that should appear today
        const todayGoals = goals.filter(g => 
          g.goal_type === 'today' || 
          g.goal_type === 'week' || 
          g.goal_type === 'always'
        );
        
        // Load completed instances from database
        const todayStr = getLocalDateString();
        const completedInstances = await loadCompletedInstances(todayStr);
        
        // Expand goals based on remaining count for TODAY's display
        const expandedGoals: any[] = [];
        todayGoals.forEach(g => {
          for (let i = 0; i < g.remaining; i++) {
            const instanceId = `${g.id}__${todayStr}__${i}`;
            expandedGoals.push({
              id: instanceId,
              originalId: g.id,
              title: g.text,
              period: g.goal_type === 'today' ? 'Hoy' : g.goal_type === 'always' ? 'Siempre' : 'Esta semana',
              status: completedInstances.has(instanceId) ? 'completed' : 'pending',
              instanceIndex: i
            });
          }
        });
        
        // Count completed instances
        const completedCount = expandedGoals.filter(g => g.status === 'completed').length;
        
        // TODAY's total: all instances + check-in
        const totalTodayGoals = expandedGoals.length + 1;
        
        setGoalsCompleted(completedCount + (checkIn ? 1 : 0));
        setTotalGoals(totalTodayGoals);
        setActiveGoals(expandedGoals);
      } else {
        // No goals yet, only count check-in
        setGoalsCompleted(checkIn ? 1 : 0);
        setTotalGoals(1);
        setActiveGoals([]);
      }
      setLoading(false);
    };

    fetchData();

    // Listen for abstinence date updates
    const handleDateUpdate = () => {
      const loadDate = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('abstinence_start_date')
          .eq('user_id', user.id)
          .single();
        
        if (profile?.abstinence_start_date) {
          setStartDate(new Date(profile.abstinence_start_date));
        }
      };
      loadDate();
    };

    window.addEventListener('abstinenceDateUpdated', handleDateUpdate);

    // Set up realtime subscription for goal completions
    const channel = supabase
      .channel('goal_completions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goal_completions'
        },
        async (payload) => {
          // Only update if the change is from another device/session
          const todayStr = getLocalDateString();
          const completedInstances = await loadCompletedInstances(todayStr);
          
          // Update only the completion status without refetching everything
          setActiveGoals(prev => prev.map(g => ({
            ...g,
            status: completedInstances.has(g.id) ? 'completed' : 'pending'
          })));
          
          setGoalsCompleted(prev => {
            const newCompleted = Array.from(completedInstances).filter(id => 
              activeGoals.some(g => g.id === id)
            ).length;
            return newCompleted + (checkInCompleted ? 1 : 0);
          });
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('abstinenceDateUpdated', handleDateUpdate);
      supabase.removeChannel(channel);
    };
  }, []);


  // Quick tools - configurable
  const quickTools = [
    { emoji: "🌬️", label: "Respiración guiada", path: "/tools", color: "text-primary" },
    { emoji: "📞", label: "Contacto de apoyo", path: "/message", color: "text-accent" },
    { emoji: "📔", label: "Diario", path: "/journal", color: "text-primary" },
    { emoji: "🚨", label: "Plan de emergencia", path: "/tools", color: "text-destructive" },
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
              <p className="text-sm font-bold text-green-500">{goalsCompleted} de {totalGoals}</p>
            </div>
            <Progress value={goalsProgress} className="h-3 [&>div]:bg-green-500" />
          </div>

          {/* Daily Check-In Status */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/50">
            <div className="flex items-center gap-3">
              <button className="flex-shrink-0 cursor-default">
                {checkInCompleted ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                ) : (
                  <Circle className="h-6 w-6 text-muted-foreground" />
                )}
              </button>
              <div>
                <p className="font-semibold text-foreground">Check-In Diario</p>
                <p className={`text-sm ${checkInCompleted ? "text-green-500" : "text-muted-foreground"}`}>
                  {checkInCompleted ? "Completado" : "Pendiente"}
                </p>
              </div>
            </div>
            {checkInCompleted ? (
              <Link to="/checkin">
                <Button size="sm" variant="outline" className="rounded-xl">Editar</Button>
              </Link>
            ) : (
              <Link to="/checkin">
                <Button size="sm" className="rounded-xl">Registrar</Button>
              </Link>
            )}
          </div>

          {/* Today's Reminder */}
          {checkInCompleted && todayReminder && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/50">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Hoy elijo recordarme que:</p>
                <p className="text-lg font-semibold text-green-500">{todayReminder}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Goals Summary */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold">Metas Activas</CardTitle>
          <Link to="/plan">
            <Button variant="ghost" size="sm" className="text-primary">Ver todas</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {activeGoals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No tienes metas activas aún</p>
              <Link to="/plan">
                <Button className="rounded-xl">
                  <span className="mr-2">🎯</span>
                  Añadir meta
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activeGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleGoal(goal.id)}
                      className="flex-shrink-0"
                    >
                      {goal.status === "completed" ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      ) : (
                        <Circle className="h-6 w-6 text-muted-foreground" />
                      )}
                    </button>
                    <div>
                      <p className="font-semibold text-foreground">
                        {goal.title}
                      </p>
                      <p className={`text-sm ${goal.status === "completed" ? "text-green-500" : "text-muted-foreground"}`}>
                        {goal.status === "completed" ? "Completado" : goal.period}
                      </p>
                    </div>
                  </div>
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
            return (
              <Link key={tool.label} to={tool.path}>
                <Card className="hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-pointer border-border/50 h-full">
                  <CardContent className="p-5 text-center space-y-3">
                    <div className={`mx-auto w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center ${tool.color}`}>
                      <span className="text-2xl">{tool.emoji}</span>
                    </div>
                    <p className="font-semibold text-foreground text-xs leading-tight">{tool.label}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Daily Motivational Message */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-6">
          <p className="text-center text-foreground text-xl font-medium leading-relaxed mb-2">
            "La confianza se construye con consistencia."
          </p>
          <p className="text-center text-muted-foreground text-sm">- Lincoln Chafee</p>
          <div className="flex justify-center mt-4">
            <Link to="/message">
              <Button variant="ghost" size="sm" className="text-primary text-xs">Ver más mensajes</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
