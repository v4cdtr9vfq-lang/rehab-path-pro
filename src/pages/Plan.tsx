import { AbstinenceCounter } from "@/components/AbstinenceCounter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ChevronDown, ChevronUp, Pencil, Trash2, CheckCircle2, Circle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Goal {
  id: string;
  text: string;
  completed: boolean;
  remaining: number;
  goal_type?: string;
}

interface ExpandedGoal extends Goal {
  originalId: string;
  instanceIndex: number;
}

export default function Plan() {
  const { toast } = useToast();
  const startDate = new Date();
  
  const [sections, setSections] = useState<{
    today: { open: boolean; goals: ExpandedGoal[] };
    week: { open: boolean; goals: ExpandedGoal[] };
    month: { open: boolean; goals: ExpandedGoal[] };
    onetime: { open: boolean; goals: ExpandedGoal[] };
  }>({
    today: { open: true, goals: [] },
    week: { open: false, goals: [] },
    month: { open: false, goals: [] },
    onetime: { open: false, goals: [] }
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState<{
    text: string;
    type: keyof typeof sections | 'always';
    remaining: number;
  }>({
    text: "",
    type: "today",
    remaining: 1
  });
  const [editingGoal, setEditingGoal] = useState<any>(null);

  // Get date key for localStorage
  const getDateKey = () => {
    return `goals_completed_${new Date().toISOString().split('T')[0]}`;
  };

  // Load completed instances from localStorage for today
  const loadCompletedInstances = (): Set<string> => {
    const stored = localStorage.getItem(getDateKey());
    return stored ? new Set(JSON.parse(stored)) : new Set();
  };

  // Save completed instances to localStorage
  const saveCompletedInstances = (completedIds: Set<string>) => {
    localStorage.setItem(getDateKey(), JSON.stringify([...completedIds]));
  };

  // Get date range for context
  const getDateRange = (context: 'today' | 'week' | 'month'): Date[] => {
    const dates: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (context === 'today') {
      dates.push(today);
    } else if (context === 'week') {
      // Get current week (last 7 days including today)
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        dates.push(date);
      }
    } else if (context === 'month') {
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
      const key = `goals_completed_${date.toISOString().split('T')[0]}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const completedIds = JSON.parse(stored);
        completedIds.forEach((id: string) => allCompleted.add(id));
      }
    });
    return allCompleted;
  };

  // Expand goals into instances based on context
  const expandGoals = (goals: Goal[], context: 'today' | 'week' | 'month' | 'onetime'): ExpandedGoal[] => {
    const dates = context === 'onetime' ? [new Date()] : getDateRange(context);
    const completedInstances = loadCompletedInstancesForRange(dates);
    const expanded: ExpandedGoal[] = [];
    
    goals.forEach(g => {
      let instanceCount = g.remaining;
      
      // Multiply instances based on context for recurring goals
      if (g.goal_type === 'always' || g.goal_type === 'today') {
        if (context === 'week') {
          instanceCount = g.remaining * 7;
        } else if (context === 'month') {
          instanceCount = g.remaining * dates.length;
        }
      } else if (g.goal_type === 'week' && context === 'month') {
        // Weekly goals in monthly view: ~4 weeks
        instanceCount = g.remaining * 4;
      }
      
      for (let i = 0; i < instanceCount; i++) {
        const instanceId = `${g.id}-${i}`;
        expanded.push({
          ...g,
          id: instanceId,
          originalId: g.id,
          instanceIndex: i,
          completed: completedInstances.has(instanceId)
        });
      }
    });
    
    return expanded;
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: goals, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (goals) {
        const alwaysGoals = goals.filter(g => g.goal_type === 'always');
        const todayGoals = goals.filter(g => g.goal_type === 'today');
        const weekGoals = goals.filter(g => g.goal_type === 'week');
        const monthGoals = goals.filter(g => g.goal_type === 'month');
        
        const groupedGoals = {
          today: { 
            open: true, 
            goals: expandGoals([...todayGoals, ...alwaysGoals], 'today')
          },
          week: { 
            open: false, 
            goals: expandGoals([...weekGoals, ...todayGoals, ...alwaysGoals], 'week')
          },
          month: { 
            open: false, 
            goals: expandGoals([...monthGoals, ...weekGoals, ...todayGoals, ...alwaysGoals], 'month')
          },
          onetime: { 
            open: false, 
            goals: expandGoals(goals.filter(g => g.goal_type === 'onetime'), 'onetime')
          }
        };
        setSections(groupedGoals);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las metas",
        variant: "destructive",
      });
    }
  };

  const toggleSection = (section: keyof typeof sections) => {
    setSections(prev => ({
      ...prev,
      [section]: { ...prev[section], open: !prev[section].open }
    }));
  };

  const toggleGoal = async (sectionKey: keyof typeof sections, goalId: string) => {
    try {
      const goal = sections[sectionKey].goals.find(g => g.id === goalId);
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

      // Update local state for this section
      setSections(prev => ({
        ...prev,
        [sectionKey]: {
          ...prev[sectionKey],
          goals: prev[sectionKey].goals.map(g =>
            g.id === goalId ? { ...g, completed: !g.completed } : g
          )
        }
      }));

      // Check if ALL instances of this goal are completed
      const allGoals = [
        ...sections.today.goals,
        ...sections.week.goals,
        ...sections.month.goals,
        ...sections.onetime.goals
      ];
      
      const instancesOfThisGoal = allGoals.filter(g => g.originalId === goal.originalId);
      const completedInstancesOfGoal = instancesOfThisGoal.filter(g => 
        completedInstances.has(g.id)
      ).length;
      const allInstancesCompleted = completedInstancesOfGoal === instancesOfThisGoal.length;

      // Update database: mark as completed only if ALL instances are done
      const { error } = await supabase
        .from('goals')
        .update({ completed: allInstancesCompleted })
        .eq('id', goal.originalId);

      if (error) throw error;

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

  const addGoal = async () => {
    if (!newGoal.text.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para añadir metas",
          variant: "destructive",
        });
        return;
      }

      const { data: goal, error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          text: newGoal.text,
          goal_type: newGoal.type,
          remaining: newGoal.remaining,
          completed: false
        })
        .select()
        .single();

      if (error) throw error;

      if (goal) {
        // Refresh all goals to get correct expansion
        await fetchGoals();

        toast({
          title: "¡Meta añadida!",
          description: "Tu meta ha sido guardada exitosamente",
        });
      }

      setNewGoal({ text: "", type: "today", remaining: 1 });
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la meta",
        variant: "destructive",
      });
    }
  };

  const deleteGoal = async (sectionKey: keyof typeof sections, goalId: string) => {
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;

      // Remove all instances of this goal from all sections
      setSections(prev => ({
        today: {
          ...prev.today,
          goals: prev.today.goals.filter(g => g.originalId !== goalId)
        },
        week: {
          ...prev.week,
          goals: prev.week.goals.filter(g => g.originalId !== goalId)
        },
        month: {
          ...prev.month,
          goals: prev.month.goals.filter(g => g.originalId !== goalId)
        },
        onetime: {
          ...prev.onetime,
          goals: prev.onetime.goals.filter(g => g.originalId !== goalId)
        }
      }));

      // Clean up localStorage for this goal's instances
      const completedInstances = loadCompletedInstances();
      const updatedInstances = new Set(
        [...completedInstances].filter(id => !id.startsWith(goalId))
      );
      saveCompletedInstances(updatedInstances);

      toast({
        title: "Meta eliminada",
        description: "La meta ha sido eliminada exitosamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la meta",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (goal: ExpandedGoal, sectionKey: string) => {
    // Find the original goal data
    const originalGoalData = sections[sectionKey as keyof typeof sections].goals.find(
      g => g.originalId === goal.originalId && g.instanceIndex === 0
    );
    if (originalGoalData) {
      setEditingGoal({ 
        ...originalGoalData, 
        id: goal.originalId,
        sectionKey 
      });
      setIsEditDialogOpen(true);
    }
  };

  const updateGoal = async () => {
    if (!editingGoal || !editingGoal.text.trim()) return;

    try {
      const { error } = await supabase
        .from('goals')
        .update({
          text: editingGoal.text,
          remaining: editingGoal.remaining
        })
        .eq('id', editingGoal.id);

      if (error) throw error;

      // Refetch to get updated expanded goals
      await fetchGoals();

      toast({
        title: "Meta actualizada",
        description: "La meta ha sido actualizada exitosamente",
      });

      setIsEditDialogOpen(false);
      setEditingGoal(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la meta",
        variant: "destructive",
      });
    }
  };

  const SectionHeader = ({ title, sectionKey }: { title: string; sectionKey: keyof typeof sections }) => {
    const count = sections[sectionKey].goals.filter(g => g.instanceIndex === 0).length;
    return (
      <button
        onClick={() => toggleSection(sectionKey)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-primary">✓</span>
          <h3 className="text-xl font-semibold text-foreground">
            {title} {count > 0 && <span className="text-muted-foreground">({count})</span>}
          </h3>
        </div>
        {sections[sectionKey].open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>
    );
  };

  // Calculate remaining count for display
  const getRemainingCount = (goal: ExpandedGoal, sectionKey: keyof typeof sections) => {
    // Get all instances of this specific goal in THIS section only
    const allGoalsInSection = sections[sectionKey].goals.filter(g => g.originalId === goal.originalId);
    const totalInstances = allGoalsInSection.length;
    
    // Count how many are completed
    const completedCount = allGoalsInSection.filter(g => g.completed).length;
    
    return totalInstances - completedCount;
  };

  const GoalItem = ({ goal, sectionKey }: { goal: ExpandedGoal; sectionKey: keyof typeof sections }) => (
    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/50">
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={() => toggleGoal(sectionKey, goal.id)}
          className="flex-shrink-0"
        >
          {goal.completed ? (
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          ) : (
            <Circle className="h-6 w-6 text-muted-foreground" />
          )}
        </button>
        <div className="flex-1">
          <p className="text-foreground font-semibold">
            {goal.text}
          </p>
          <p className={`text-sm ${goal.completed ? 'text-green-500' : 'text-muted-foreground'}`}>
            {goal.completed ? 'Completado' : `${getRemainingCount(goal, sectionKey)} restante${getRemainingCount(goal, sectionKey) !== 1 ? 's' : ''} ${sectionKey === "today" ? "hoy" : sectionKey === "week" ? "esta semana" : sectionKey === "month" ? "este mes" : ""}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {goal.instanceIndex === 0 && (
          <>
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-primary/30 text-primary font-medium">
              {sections[sectionKey].goals.filter(g => g.originalId === goal.originalId).length}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => openEditDialog(goal, sectionKey)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar meta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. La meta será eliminada permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteGoal(sectionKey, goal.originalId)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight tracking-tight mb-3">Mi Plan</h1>
        <p className="text-muted-foreground text-lg">Rastrea tus metas y progreso de recuperación</p>
      </div>

      <AbstinenceCounter startDate={startDate} />

      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-foreground">Metas</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="accent" className="gap-2">
              <Plus className="h-5 w-5" />
              Añadir Meta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Añadir Nueva Meta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="goal-text">Meta</Label>
                <Input
                  id="goal-text"
                  placeholder="Escribe tu meta..."
                  value={newGoal.text}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, text: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal-type">Tipo</Label>
                <Select value={newGoal.type} onValueChange={(value) => setNewGoal(prev => ({ ...prev, type: value as (keyof typeof sections | 'always') }))}>
                  <SelectTrigger id="goal-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Hoy</SelectItem>
                    <SelectItem value="week">Esta Semana</SelectItem>
                    <SelectItem value="month">Este Mes</SelectItem>
                    <SelectItem value="onetime">Meta Única</SelectItem>
                    <SelectItem value="always">Siempre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal-remaining">Número de veces</Label>
                <Input
                  id="goal-remaining"
                  type="number"
                  min="1"
                  value={newGoal.remaining}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, remaining: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <Button onClick={addGoal} className="w-full">
                Añadir
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Goal Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Meta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-goal-text">Meta</Label>
              <Input
                id="edit-goal-text"
                placeholder="Escribe tu meta..."
                value={editingGoal?.text || ""}
                onChange={(e) => setEditingGoal(prev => ({ ...prev, text: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-goal-remaining">Número de veces</Label>
              <Input
                id="edit-goal-remaining"
                type="number"
                min="1"
                value={editingGoal?.remaining || 1}
                onChange={(e) => setEditingGoal(prev => ({ ...prev, remaining: parseInt(e.target.value) || 1 }))}
              />
            </div>
            <Button onClick={updateGoal} className="w-full">
              Guardar Cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {/* Today */}
        <Card className="border-border/50 bg-card/50 backdrop-blur rounded-3xl shadow-lg">
          <CardHeader>
            <SectionHeader title="Hoy" sectionKey="today" />
          </CardHeader>
          {sections.today.open && (
            <CardContent className="space-y-3">
              {sections.today.goals
                .filter(goal => goal.instanceIndex === 0)
                .map(goal => (
                  <GoalItem key={goal.id} goal={goal} sectionKey="today" />
                ))}
            </CardContent>
          )}
        </Card>

        {/* This Week */}
        <Card className="border-border/50 bg-card/50 backdrop-blur rounded-3xl shadow-lg">
          <CardHeader>
            <SectionHeader title="Esta Semana (L-D)" sectionKey="week" />
          </CardHeader>
          {sections.week.open && (
            <CardContent className="space-y-3">
              {sections.week.goals
                .filter(goal => goal.instanceIndex === 0)
                .map(goal => (
                  <GoalItem key={goal.id} goal={goal} sectionKey="week" />
                ))}
            </CardContent>
          )}
        </Card>

        {/* This Month */}
        <Card className="border-border/50 bg-card/50 backdrop-blur rounded-3xl shadow-lg">
          <CardHeader>
            <SectionHeader title="Este Mes" sectionKey="month" />
          </CardHeader>
          {sections.month.open && (
            <CardContent className="space-y-3">
              {sections.month.goals
                .filter(goal => goal.instanceIndex === 0)
                .map(goal => (
                  <GoalItem key={goal.id} goal={goal} sectionKey="month" />
                ))}
            </CardContent>
          )}
        </Card>

        {/* One-Time Goals */}
        <Card className="border-border/50 bg-card/50 backdrop-blur rounded-3xl shadow-lg">
          <CardHeader>
            <SectionHeader title="Metas Únicas" sectionKey="onetime" />
          </CardHeader>
          {sections.onetime.open && (
            <CardContent className="space-y-3">
              {sections.onetime.goals
                .filter(goal => goal.instanceIndex === 0)
                .map(goal => (
                  <GoalItem key={goal.id} goal={goal} sectionKey="onetime" />
                ))}
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
