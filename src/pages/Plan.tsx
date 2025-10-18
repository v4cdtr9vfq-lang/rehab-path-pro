import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, ChevronDown, ChevronUp, Pencil, Trash2, CheckCircle2, Circle, CalendarIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
interface Goal {
  id: string;
  text: string;
  completed: boolean;
  remaining: number;
  goal_type?: string;
  target_date?: string;
  periodic_type?: string;
}
interface ExpandedGoal extends Goal {
  originalId: string;
  instanceIndex: number;
}
export default function Plan() {
  const {
    toast
  } = useToast();
  const [sections, setSections] = useState<{
    today: {
      open: boolean;
      goals: ExpandedGoal[];
    };
    week: {
      open: boolean;
      goals: ExpandedGoal[];
    };
    month: {
      open: boolean;
      goals: ExpandedGoal[];
    };
    onetime: {
      open: boolean;
      goals: ExpandedGoal[];
    };
  }>({
    today: {
      open: true,
      goals: []
    },
    week: {
      open: false,
      goals: []
    },
    month: {
      open: false,
      goals: []
    },
    onetime: {
      open: false,
      goals: []
    }
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState<{
    text: string;
    type: keyof typeof sections | 'always' | 'periodic';
    remaining: number;
    target_date?: Date;
    periodic_type?: string;
    description?: string;
  }>({
    text: "",
    type: "today",
    remaining: 1,
    description: ""
  });
  const [editingGoal, setEditingGoal] = useState<any>(null);

  // Get local date string without UTC conversion
  const getLocalDateString = (date: Date = new Date()): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Load completed instances from database for a specific date
  const loadCompletedInstances = async (date: string): Promise<Set<string>> => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return new Set();
      const {
        data,
        error
      } = await supabase.from('goal_completions').select('goal_id, instance_index').eq('user_id', user.id).eq('completion_date', date);
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

  // Load completed instances from database for a date range
  const loadCompletedInstancesForRange = async (dates: Date[]): Promise<Set<string>> => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return new Set();
      const dateStrings = dates.map(d => getLocalDateString(d));
      const {
        data,
        error
      } = await supabase.from('goal_completions').select('goal_id, instance_index, completion_date').eq('user_id', user.id).in('completion_date', dateStrings);
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

  // Save completion to database
  const saveCompletion = async (goalId: string, instanceIndex: number, date: string, isCompleted: boolean) => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      if (isCompleted) {
        // Add completion
        await supabase.from('goal_completions').insert({
          user_id: user.id,
          goal_id: goalId,
          completion_date: date,
          instance_index: instanceIndex
        });
      } else {
        // Remove completion
        await supabase.from('goal_completions').delete().eq('user_id', user.id).eq('goal_id', goalId).eq('completion_date', date).eq('instance_index', instanceIndex);
      }
      // Realtime will handle the update automatically
    } catch (error) {
      console.error('Error saving completion:', error);
      throw error;
    }
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
      // Get remaining days of current month (from today to end of month)
      const year = today.getFullYear();
      const month = today.getMonth();
      const currentDay = today.getDate();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = currentDay; day <= daysInMonth; day++) {
        dates.push(new Date(year, month, day));
      }
    }
    return dates;
  };

  // Expand goals into instances based on context
  const expandGoals = async (goals: Goal[], context: 'today' | 'week' | 'month' | 'onetime'): Promise<ExpandedGoal[]> => {
    const dates = context === 'onetime' ? [new Date()] : getDateRange(context);
    const expanded: ExpandedGoal[] = [];

    // Load all completions for the date range at once
    const allCompletedInstances = await loadCompletedInstancesForRange(dates);
    goals.forEach(g => {
      // One-time goals: only show one instance total (not per day)
      if (g.goal_type === 'onetime') {
        const todayStr = getLocalDateString();
        // Create only ONE instance (index 0) regardless of remaining count
        const instanceId = `${g.id}__${todayStr}__0`;
        expanded.push({
          ...g,
          id: instanceId,
          originalId: g.id,
          instanceIndex: 0,
          completed: allCompletedInstances.has(instanceId)
        });
      } else {
        // Recurring goals: iterate through dates
        dates.forEach((date, dayIndex) => {
          const dateStr = getLocalDateString(date);
          
          // Periodic goals: only create instances on their specific day
          if (g.goal_type === 'periodic' && g.periodic_type) {
            const dayOfMonth = date.getDate();
            const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
            let isSpecificDay = false;
            
            if (g.periodic_type === 'inicio_mes' && dayOfMonth === 1) {
              isSpecificDay = true;
            } else if (g.periodic_type === 'mitad_mes' && dayOfMonth === 15) {
              isSpecificDay = true;
            } else if (g.periodic_type === 'final_mes' && dayOfMonth === lastDayOfMonth) {
              isSpecificDay = true;
            }
            
            // Only create instances on the specific day
            if (isSpecificDay) {
              for (let i = 0; i < g.remaining; i++) {
                const instanceId = `${g.id}__${dateStr}__${i}`;
                expanded.push({
                  ...g,
                  id: instanceId,
                  originalId: g.id,
                  instanceIndex: i,
                  completed: allCompletedInstances.has(instanceId)
                });
              }
            }
          } else if (g.goal_type === 'week' && context === 'month') {
            // Weekly goals in monthly view: only on week boundaries
            if (dayIndex % 7 === 0) {
              for (let i = 0; i < g.remaining; i++) {
                const instanceId = `${g.id}__${dateStr}__${i}`;
                expanded.push({
                  ...g,
                  id: instanceId,
                  originalId: g.id,
                  instanceIndex: dayIndex * g.remaining + i,
                  completed: allCompletedInstances.has(instanceId)
                });
              }
            }
          } else {
            // Daily and always goals: create instances for each day
            for (let i = 0; i < g.remaining; i++) {
              const instanceId = `${g.id}__${dateStr}__${i}`;
              expanded.push({
                ...g,
                id: instanceId,
                originalId: g.id,
                instanceIndex: dayIndex * g.remaining + i,
                completed: allCompletedInstances.has(instanceId)
              });
            }
          }
        });
      }
    });
    return expanded;
  };
  useEffect(() => {
    fetchGoals();

    // Set up realtime subscription for goal completions
    const channel = supabase.channel('plan_goal_completions').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'goal_completions'
    }, async () => {
      // Only reload goals when changes come from other devices
      // Use a small delay to batch multiple rapid changes
      setTimeout(() => {
        fetchGoals();
      }, 300);
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  const fetchGoals = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      const {
        data: goals,
        error
      } = await supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      if (goals) {
        const alwaysGoals = goals.filter(g => g.goal_type === 'always');
        const todayGoals = goals.filter(g => g.goal_type === 'today');
        const weekGoals = goals.filter(g => g.goal_type === 'week');
        const monthGoals = goals.filter(g => g.goal_type === 'month');
        const periodicGoals = goals.filter(g => g.goal_type === 'periodic');
        const onetimeGoals = goals.filter(g => g.goal_type === 'onetime');
        
        const groupedGoals = {
          today: {
            open: sections.today.open,
            goals: await expandGoals([...todayGoals, ...periodicGoals, ...alwaysGoals, ...onetimeGoals], 'today')
          },
          week: {
            open: sections.week.open,
            goals: await expandGoals([...weekGoals, ...periodicGoals, ...todayGoals, ...alwaysGoals, ...onetimeGoals], 'week')
          },
          month: {
            open: sections.month.open,
            goals: await expandGoals([...monthGoals, ...periodicGoals, ...weekGoals, ...todayGoals, ...alwaysGoals, ...onetimeGoals], 'month')
          },
          onetime: {
            open: sections.onetime.open,
            goals: await expandGoals(onetimeGoals, 'onetime')
          }
        };
        setSections(groupedGoals);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las metas.",
        variant: "destructive"
      });
    }
  };
  const toggleSection = (section: keyof typeof sections) => {
    setSections(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        open: !prev[section].open
      }
    }));
  };
  const toggleGoal = async (sectionKey: keyof typeof sections, goalId: string) => {
    try {
      const goal = sections[sectionKey].goals.find(g => g.id === goalId);
      if (!goal) return;

      // Parse goalId format: uuid__date__index or uuid__date (for onetime)
      const parts = goalId.split('__');
      let dateStr: string;
      let instanceIndex: number;
      if (parts.length === 3) {
        // Format: uuid__yyyy-mm-dd__index
        dateStr = parts[1];
        instanceIndex = parseInt(parts[2]);
      } else {
        // Format: uuid__index (onetime goal, use today)
        dateStr = getLocalDateString();
        instanceIndex = parseInt(parts[1]);
      }
      const wasCompleted = goal.completed;

      // Optimistically update UI
      const updatedSections = {
        ...sections
      };
      Object.keys(updatedSections).forEach(key => {
        const sk = key as keyof typeof sections;
        updatedSections[sk] = {
          ...updatedSections[sk],
          goals: updatedSections[sk].goals.map(g => g.id === goalId ? {
            ...g,
            completed: !wasCompleted
          } : g)
        };
      });
      setSections(updatedSections);

      // Save to database (realtime will sync to other devices)
      await saveCompletion(goal.originalId, instanceIndex, dateStr, !wasCompleted);

      // Check if ALL instances of this goal are completed
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      const allGoals = [...updatedSections.today.goals, ...updatedSections.week.goals, ...updatedSections.month.goals, ...updatedSections.onetime.goals];
      const instancesOfThisGoal = allGoals.filter(g => g.originalId === goal.originalId);
      const allCompleted = instancesOfThisGoal.every(g => g.completed);

      // Update database: mark as completed only if ALL instances are done
      await supabase.from('goals').update({
        completed: allCompleted
      }).eq('id', goal.originalId);
      toast({
        title: "Meta actualizada",
        description: "El estado de la meta ha sido actualizado."
      });
    } catch (error: any) {
      console.error('Error in toggleGoal:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la meta.",
        variant: "destructive"
      });
      // Revert on error
      fetchGoals();
    }
  };
  const addGoal = async () => {
    if (!newGoal.text.trim()) return;
    
    // Validar que si es periódica, tenga periodicidad seleccionada
    if (newGoal.type === 'periodic' && !newGoal.periodic_type) {
      toast({
        title: "Error",
        description: "Debes seleccionar una periodicidad para las metas periódicas.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsDialogOpen(false); // Cerrar inmediatamente para evitar doble clic
      
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para añadir metas.",
          variant: "destructive"
        });
        return;
      }
      const {
        data: goal,
        error
      } = await supabase.from('goals').insert({
        user_id: user.id,
        text: newGoal.text,
        goal_type: newGoal.type,
        remaining: newGoal.type === 'onetime' ? 1 : newGoal.remaining,
        completed: false,
        target_date: newGoal.target_date ? format(newGoal.target_date, 'yyyy-MM-dd') : null,
        periodic_type: newGoal.periodic_type || null,
        description: newGoal.description || null
      }).select().single();
      if (error) throw error;
      if (goal) {
        // Refresh all goals to get correct expansion
        await fetchGoals();
        toast({
          title: "Meta añadida",
          description: "Tu meta ha sido guardada exitosamente."
        });
      }
      setNewGoal({
        text: "",
        type: "today",
        remaining: 1,
        target_date: undefined,
        periodic_type: undefined,
        description: ""
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la meta.",
        variant: "destructive"
      });
      setIsDialogOpen(true); // Reabrir si hay error
    }
  };
  const deleteGoal = async (sectionKey: keyof typeof sections, goalId: string) => {
    try {
      const {
        error
      } = await supabase.from('goals').delete().eq('id', goalId);
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
      toast({
        title: "Meta eliminada",
        description: "La meta ha sido eliminada exitosamente."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la meta.",
        variant: "destructive"
      });
    }
  };
  const openEditDialog = (goal: ExpandedGoal, sectionKey: string) => {
    // Find the original goal data
    const originalGoalData = sections[sectionKey as keyof typeof sections].goals.find(g => g.originalId === goal.originalId && g.instanceIndex === 0);
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
      const updateData: any = {
        text: editingGoal.text,
        remaining: editingGoal.remaining
      };

      // Only update periodic_type if it's a periodic goal
      if (editingGoal.goal_type === 'periodic') {
        updateData.periodic_type = editingGoal.periodic_type;
      }
      
      // Add notes if provided
      if (editingGoal.notes !== undefined) {
        updateData.notes = editingGoal.notes || null;
      }
      
      // Add instructions if provided
      if (editingGoal.instructions !== undefined) {
        updateData.instructions = editingGoal.instructions || null;
      }
      
      const {
        error
      } = await supabase.from('goals').update(updateData).eq('id', editingGoal.id);
      if (error) throw error;

      // Refetch to get updated expanded goals
      await fetchGoals();
      toast({
        title: "Meta actualizada",
        description: "La meta ha sido actualizada exitosamente."
      });
      setIsEditDialogOpen(false);
      setEditingGoal(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la meta.",
        variant: "destructive"
      });
    }
  };
  const SectionHeader = ({
    title,
    sectionKey
  }: {
    title: string;
    sectionKey: keyof typeof sections;
  }) => {
    const count = sections[sectionKey].goals.filter(g => g.instanceIndex === 0).length;
    return <button onClick={() => toggleSection(sectionKey)} className="flex items-center justify-between w-full text-left gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-primary flex-shrink-0">✓</span>
          <h3 className="text-xl font-semibold text-foreground">
            {title} {count > 0 && <span className="text-muted-foreground">({count})</span>}
          </h3>
        </div>
        {sections[sectionKey].open ? <ChevronUp className="h-5 w-5 flex-shrink-0" /> : <ChevronDown className="h-5 w-5 flex-shrink-0" />}
      </button>;
  };

  // Calculate remaining count for display - recalculate from goal completion status
  const getRemainingCount = (goal: ExpandedGoal, sectionKey: keyof typeof sections) => {
    // Get all instances of this specific goal in THIS section only
    const allGoalsInSection = sections[sectionKey].goals.filter(g => g.originalId === goal.originalId);

    // Count completed instances
    const completedCount = allGoalsInSection.filter(g => g.completed).length;
    const totalInstances = allGoalsInSection.length;
    return totalInstances - completedCount;
  };
  const GoalItem = ({
    goal,
    sectionKey
  }: {
    goal: ExpandedGoal;
    sectionKey: keyof typeof sections;
  }) => {
    // Read completion status directly from the goal prop (which comes from expanded goals)
    // The goal.completed is already synced from localStorage in expandGoals
    const isClickable = sectionKey !== 'week' && sectionKey !== 'month';
    
    // For week/month views, check if ALL instances are completed
    const allInstancesOfGoal = sections[sectionKey].goals.filter(g => g.originalId === goal.originalId);
    const allCompleted = allInstancesOfGoal.every(g => g.completed);
    const displayCompleted = (sectionKey === 'week' || sectionKey === 'month') ? allCompleted : goal.completed;
    
    return <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/50">
        <div className="flex items-center gap-3 flex-1">
          <button onClick={isClickable ? () => toggleGoal(sectionKey, goal.id) : undefined} className={`flex-shrink-0 ${!isClickable ? 'cursor-default' : ''}`} disabled={!isClickable}>
            {displayCompleted ? <CheckCircle2 className="h-6 w-6 text-green-500" /> : <Circle className="h-6 w-6 text-muted-foreground" />}
          </button>
          <div className="flex-1">
            <p className="text-foreground font-semibold">
              {goal.text}
            </p>
            <p className={`text-sm ${displayCompleted ? 'text-green-500' : 'text-muted-foreground'}`}>
              {displayCompleted ? 'Completado' : `${getRemainingCount(goal, sectionKey)} restante${getRemainingCount(goal, sectionKey) !== 1 ? 's' : ''} ${sectionKey === "today" ? "hoy" : sectionKey === "week" ? "esta semana" : sectionKey === "month" ? "este mes" : ""}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-center">
          {goal.instanceIndex === 0 && <>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-medium flex-shrink-0 ${displayCompleted ? 'border-green-500 text-green-500' : 'border-primary/30 text-primary'}`}>
                {sections[sectionKey].goals.filter(g => g.originalId === goal.originalId).length}
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => openEditDialog(goal, sectionKey)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive flex-shrink-0">
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
                    <AlertDialogAction onClick={() => deleteGoal(sectionKey, goal.originalId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>}
        </div>
      </div>;
  };
  return <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-foreground">Metas</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="accent" className="gap-2">
              <Plus className="h-5 w-5" />
              Añadir meta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Añadir nueva meta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="goal-text">Meta</Label>
                <Input id="goal-text" placeholder="Escribe tu meta..." value={newGoal.text} onChange={e => setNewGoal(prev => ({
                ...prev,
                text: e.target.value
              }))} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="goal-description">Descripción</Label>
                <Textarea 
                  id="goal-description" 
                  placeholder="Descripción de la meta..." 
                  value={newGoal.description || ""} 
                  onChange={e => setNewGoal(prev => ({
                    ...prev,
                    description: e.target.value
                  }))}
                  rows={2}
                  className="resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal-type">Tipo</Label>
                <Select value={newGoal.type} onValueChange={value => setNewGoal(prev => ({
                ...prev,
                type: value as (keyof typeof sections | 'always' | 'periodic'),
                target_date: undefined,
                periodic_type: undefined
              }))}>
                  <SelectTrigger id="goal-type">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Hoy</SelectItem>
                    <SelectItem value="week">Esta semana</SelectItem>
                    <SelectItem value="month">Este mes</SelectItem>
                    <SelectItem value="onetime">Meta única</SelectItem>
                    <SelectItem value="periodic">Meta periódica</SelectItem>
                    <SelectItem value="always">Siempre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newGoal.type === 'onetime' && <div className="space-y-2">
                  <Label>Fecha objetivo</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !newGoal.target_date && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newGoal.target_date ? format(newGoal.target_date, "PPP", {
                      locale: es
                    }) : <span>Seleccionar fecha</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={newGoal.target_date} onSelect={date => setNewGoal(prev => ({
                    ...prev,
                    target_date: date
                  }))} initialFocus className={cn("p-3 pointer-events-auto")} />
                    </PopoverContent>
                  </Popover>
                </div>}

              {newGoal.type === 'periodic' && <div className="space-y-2">
                  <Label htmlFor="periodic-type">Periodicidad</Label>
                  <Select value={newGoal.periodic_type} onValueChange={value => setNewGoal(prev => ({
                ...prev,
                periodic_type: value
              }))}>
                    <SelectTrigger id="periodic-type">
                      <SelectValue placeholder="Seleccionar periodicidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inicio_mes">Primero de mes</SelectItem>
                      <SelectItem value="mitad_mes">Mitad de mes</SelectItem>
                      <SelectItem value="final_mes">Final de mes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>}

              {newGoal.type !== 'onetime' && <div className="space-y-2">
                <Label htmlFor="goal-remaining">Número de veces</Label>
                <Input id="goal-remaining" type="number" min="1" value={newGoal.remaining} onChange={e => setNewGoal(prev => ({
                ...prev,
                remaining: parseInt(e.target.value) || 1
              }))} />
              </div>}
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
            <DialogTitle>Editar meta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-goal-text">Meta</Label>
              <Input id="edit-goal-text" placeholder="Escribe tu meta..." value={editingGoal?.text || ""} onChange={e => setEditingGoal(prev => ({
              ...prev,
              text: e.target.value
            }))} />
            </div>
            
            {editingGoal?.goal_type === 'periodic' && <div className="space-y-2">
                <Label htmlFor="edit-periodic-type">Periodicidad</Label>
                <Select value={editingGoal?.periodic_type || ""} onValueChange={value => setEditingGoal(prev => ({
              ...prev,
              periodic_type: value
            }))}>
                  <SelectTrigger id="edit-periodic-type">
                    <SelectValue placeholder="Seleccionar periodicidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inicio_mes">Primero de mes</SelectItem>
                    <SelectItem value="mitad_mes">Mitad de mes</SelectItem>
                    <SelectItem value="final_mes">Final de mes</SelectItem>
                  </SelectContent>
                </Select>
              </div>}

            <div className="space-y-2">
              <Label htmlFor="edit-goal-remaining">Número de veces</Label>
              <Input id="edit-goal-remaining" type="number" min="1" value={editingGoal?.remaining || 1} onChange={e => setEditingGoal(prev => ({
              ...prev,
              remaining: parseInt(e.target.value) || 1
            }))} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-goal-notes">Observaciones</Label>
              <Textarea 
                id="edit-goal-notes" 
                placeholder="Observaciones sobre la meta..." 
                value={editingGoal?.notes || ""} 
                onChange={e => setEditingGoal(prev => ({
                  ...prev,
                  notes: e.target.value
                }))}
                rows={3}
                className="resize-none"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-goal-instructions">Instrucciones</Label>
              <Textarea 
                id="edit-goal-instructions" 
                placeholder="Instrucciones para la meta..." 
                value={editingGoal?.instructions || ""} 
                onChange={e => setEditingGoal(prev => ({
                  ...prev,
                  instructions: e.target.value
                }))}
                rows={3}
                className="resize-none"
              />
            </div>
            <Button onClick={updateGoal} className="w-full">
              Guardar cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {/* Today */}
        <Card className="border-border/50 bg-card/50 backdrop-blur rounded-3xl">
          <CardHeader>
            <SectionHeader title="Hoy" sectionKey="today" />
          </CardHeader>
          {sections.today.open && <CardContent className="space-y-3">
              {sections.today.goals.filter(goal => goal.instanceIndex === 0).map(goal => <GoalItem key={goal.id} goal={goal} sectionKey="today" />)}
            </CardContent>}
        </Card>

        {/* This Week */}
        <Card className="border-border/50 bg-card/50 backdrop-blur rounded-3xl">
          <CardHeader>
            <SectionHeader title="Esta semana (L-D)" sectionKey="week" />
          </CardHeader>
          {sections.week.open && <CardContent className="space-y-3">
              {sections.week.goals.filter(goal => goal.instanceIndex === 0).map(goal => <GoalItem key={goal.id} goal={goal} sectionKey="week" />)}
            </CardContent>}
        </Card>

        {/* This Month */}
        <Card className="border-border/50 bg-card/50 backdrop-blur rounded-3xl">
          <CardHeader>
            <SectionHeader title="Este mes" sectionKey="month" />
          </CardHeader>
          {sections.month.open && <CardContent className="space-y-3">
              {sections.month.goals.filter(goal => goal.instanceIndex === 0).map(goal => <GoalItem key={goal.id} goal={goal} sectionKey="month" />)}
            </CardContent>}
        </Card>

        {/* One-Time Goals */}
        <Card className="border-border/50 bg-card/50 backdrop-blur rounded-3xl">
          <CardHeader>
            <SectionHeader title="Metas únicas" sectionKey="onetime" />
          </CardHeader>
          {sections.onetime.open && <CardContent className="space-y-3">
              {sections.onetime.goals.filter(goal => goal.instanceIndex === 0).map(goal => <GoalItem key={goal.id} goal={goal} sectionKey="onetime" />)}
            </CardContent>}
        </Card>
      </div>
    </div>;
}