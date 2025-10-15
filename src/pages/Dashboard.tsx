import { AbstinenceCounter } from "@/components/AbstinenceCounter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Target, ClipboardCheck, Phone, Wind, BookOpen, AlertCircle, CheckCircle2, Clock, Circle } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [checkInCompleted, setCheckInCompleted] = useState(false);
  const [todayEmotion, setTodayEmotion] = useState("");
  const [goalsCompleted, setGoalsCompleted] = useState(0);
  const [totalGoals, setTotalGoals] = useState(0);
  const goalsProgress = totalGoals > 0 ? (goalsCompleted / totalGoals) * 100 : 0;
  const [activeGoals, setActiveGoals] = useState<any[]>([]);

  // Get today's date key for localStorage
  const getTodayKey = () => {
    return `goals_completed_${new Date().toISOString().split('T')[0]}`;
  };

  // Load completed instances from localStorage
  const loadCompletedInstances = (): Set<string> => {
    const stored = localStorage.getItem(getTodayKey());
    return stored ? new Set(JSON.parse(stored)) : new Set();
  };

  // Save completed instances to localStorage and notify other components
  const saveCompletedInstances = (completedIds: Set<string>) => {
    localStorage.setItem(getTodayKey(), JSON.stringify([...completedIds]));
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('goalsUpdated', { 
      detail: { date: getTodayKey(), completedIds: [...completedIds] } 
    }));
  };

  const toggleGoal = async (goalId: string) => {
    try {
      const goal = activeGoals.find(g => g.id === goalId);
      if (!goal) return;

      // Load current completed instances
      const completedInstances = loadCompletedInstances();
      
      // Toggle THIS instance
      if (completedInstances.has(goalId)) {
        completedInstances.delete(goalId);
      } else {
        completedInstances.add(goalId);
      }

      // Save to localStorage
      saveCompletedInstances(completedInstances);

      // Update local state
      const updatedGoals = activeGoals.map(g => ({
        ...g,
        status: completedInstances.has(g.id) ? 'completed' : 'pending'
      }));

      setActiveGoals(updatedGoals);

      // Count how many instances of this specific goal are completed
      const instancesOfThisGoal = updatedGoals.filter(g => g.originalId === goal.originalId);
      const completedInstancesOfGoal = instancesOfThisGoal.filter(g => g.status === 'completed').length;
      const allInstancesCompleted = completedInstancesOfGoal === instancesOfThisGoal.length;

      // Update database: mark as completed only if ALL instances are done
      const { error } = await supabase
        .from('goals')
        .update({ completed: allInstancesCompleted })
        .eq('id', goal.originalId);

      if (error) throw error;

      // Recalculate TODAY's completed count
      const totalCompletedToday = updatedGoals.filter(g => g.status === 'completed').length;
      const totalTodayGoals = updatedGoals.length + 1; // All instances + check-in
      
      setGoalsCompleted(totalCompletedToday + (checkInCompleted ? 1 : 0));
      setTotalGoals(totalTodayGoals);

      toast({
        title: "Meta actualizada",
        description: "El estado de la meta ha sido actualizado",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la meta",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('abstinence_start_date')
        .eq('user_id', user.id)
        .single();
      
      if (profile?.abstinence_start_date) {
        setStartDate(new Date(profile.abstinence_start_date));
      }

      // Check yesterday's check-in to determine if we need to reset
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const { data: yesterdayCheckIn } = await supabase
        .from('check_ins')
        .select('id')
        .eq('user_id', user.id)
        .eq('check_in_date', yesterdayStr)
        .maybeSingle();

      // If no check-in yesterday, reset all goals
      if (!yesterdayCheckIn) {
        await supabase
          .from('goals')
          .update({ completed: false })
          .eq('user_id', user.id);
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
        const emotion = checkIn.answers['3'];
        if (emotion) setTodayEmotion(emotion);
      }

      // Fetch today's goals (including 'always' type)
      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id);

      console.log('Goals data:', goals);
      console.log('Goals error:', goalsError);

      if (goals && goals.length > 0) {
        // Filter goals that should appear today
        const todayGoals = goals.filter(g => 
          g.goal_type === 'today' || 
          g.goal_type === 'week' || 
          g.goal_type === 'always'
        );
        
        // Load completed instances from localStorage
        const completedInstances = loadCompletedInstances();
        const todayStr = new Date().toISOString().split('T')[0];
        
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
    }
    setLoading(false);
  };

    fetchData();
  }, []);

  // Listen for goal updates from other components
  useEffect(() => {
    const handleGoalsUpdate = () => {
      const completedInstances = loadCompletedInstances();
      
      // Update activeGoals with new completion status
      const updatedGoals = activeGoals.map(g => ({
        ...g,
        status: completedInstances.has(g.id) ? 'completed' : 'pending'
      }));
      
      setActiveGoals(updatedGoals);
      
      // Recalculate counts
      const completedCount = updatedGoals.filter(g => g.status === 'completed').length;
      setGoalsCompleted(completedCount + (checkInCompleted ? 1 : 0));
    };

    window.addEventListener('goalsUpdated', handleGoalsUpdate);
    return () => window.removeEventListener('goalsUpdated', handleGoalsUpdate);
  }, [activeGoals, checkInCompleted]);

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
                  <Target className="h-4 w-4 mr-2" />
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
            const Icon = tool.icon;
            return (
              <Link key={tool.label} to={tool.path}>
                <Card className="hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-pointer border-border/50 h-full">
                  <CardContent className="p-5 text-center space-y-3">
                    <div className={`mx-auto w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center ${tool.color}`}>
                      <Icon className="h-6 w-6" />
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
