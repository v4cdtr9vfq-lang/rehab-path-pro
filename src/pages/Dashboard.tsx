import { AbstinenceCounter } from "@/components/AbstinenceCounter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Clock, Circle, Star, GripVertical, PartyPopper } from "lucide-react";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
export default function Home() {
  const {
    toast
  } = useToast();
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [checkInCompleted, setCheckInCompleted] = useState(false);
  const [todayReminder, setTodayReminder] = useState("");
  const [goalsCompleted, setGoalsCompleted] = useState(0);
  const [totalGoals, setTotalGoals] = useState(0);
  const goalsProgress = totalGoals > 0 ? goalsCompleted / totalGoals * 100 : 0;
  const [activeGoals, setActiveGoals] = useState<any[]>([]);
  const [isQuoteSaved, setIsQuoteSaved] = useState(false);
  const [savedQuotes, setSavedQuotes] = useState<any[]>([]);
  const [medals, setMedals] = useState<any[]>([]);
  const [showMedalPopup, setShowMedalPopup] = useState(false);
  const [newMedal, setNewMedal] = useState<{type: string, name: string, emoji: string} | null>(null);
  const [sobrietyDays, setSobrietyDays] = useState(0);
  const allQuotes = [{
    text: "Siempre es lo simple lo que produce lo maravilloso.",
    author: "Amelia Barr"
  }, {
    text: "La confianza se construye con consistencia.",
    author: "Lincoln Chafee"
  }, {
    text: "Un viaje de mil millas comienza con un solo paso.",
    author: "Lao Tzu"
  }, {
    text: "La valentía no es la ausencia del miedo, sino el triunfo sobre él.",
    author: "Nelson Mandela"
  }, {
    text: "El éxito es la suma de pequeños esfuerzos repetidos día tras día.",
    author: "Robert Collier"
  }, {
    text: "No cuentes los días, haz que los días cuenten.",
    author: "Muhammad Ali"
  }, {
    text: "La recuperación no es un destino, es un viaje.",
    author: "Anónimo"
  }, {
    text: "Cada día es una nueva oportunidad para comenzar de nuevo.",
    author: "Desconocido"
  }, {
    text: "La fuerza no viene de lo que puedes hacer. Viene de superar las cosas que creías que no podías hacer.",
    author: "Rikki Rogers"
  }, {
    text: "El primer paso no te lleva donde quieres ir, pero te saca de donde estás.",
    author: "Anónimo"
  }];

  // Get quote of the day based on date
  const getQuoteOfTheDay = () => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    return allQuotes[dayOfYear % allQuotes.length];
  };
  const dailyQuote = getQuoteOfTheDay();
  const reflections = ["¿Cómo puedes practicar la simplicidad en tu recuperación hoy? ¿Qué pequeña acción consistente puedes tomar para construir confianza contigo mismo y con los demás?", "¿Qué obstáculo te está deteniendo hoy? ¿Cómo puedes transformarlo en una oportunidad de crecimiento?", "¿Qué cosa pequeña puedes hacer hoy para cuidar mejor de ti mismo?", "¿A quién puedes agradecer hoy por su apoyo en tu camino de recuperación?", "¿Qué has aprendido sobre ti mismo en los últimos días? ¿Cómo puedes aplicar esa lección hoy?", "¿Qué te hace sentir más fuerte en tu recuperación? ¿Cómo puedes incorporar más de eso en tu día?", "¿Qué significa para ti el progreso hoy? ¿Cómo lo vas a medir?", "¿Qué cosa puedes perdonarte hoy? ¿Qué paso puedes dar hacia adelante?"];

  // Get reflection of the day based on date
  const getReflectionOfTheDay = () => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    return reflections[dayOfYear % reflections.length];
  };

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
  const toggleGoal = async (goalId: string) => {
    try {
      const goal = activeGoals.find(g => g.id === goalId);
      if (!goal) return;
      const todayStr = getLocalDateString();
      const wasCompleted = goal.status === 'completed';

      // Optimistically update UI immediately
      const updatedGoals = activeGoals.map(g => g.id === goalId ? {
        ...g,
        status: wasCompleted ? 'pending' : 'completed'
      } : g);
      setActiveGoals(updatedGoals);

      // Recalculate completed count
      const totalCompletedToday = updatedGoals.filter(g => g.status === 'completed').length;
      setGoalsCompleted(totalCompletedToday + (checkInCompleted ? 1 : 0));

      // Save to database (realtime will sync to other devices)
      await saveCompletion(goal.originalId, goal.instanceIndex, todayStr, !wasCompleted);

      // Update database: mark goal as completed only if ALL instances are done
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      const instancesOfThisGoal = updatedGoals.filter(g => g.originalId === goal.originalId);
      const completedInstancesOfGoal = instancesOfThisGoal.filter(g => g.status === 'completed').length;
      const allInstancesCompleted = completedInstancesOfGoal === instancesOfThisGoal.length;
      await supabase.from('goals').update({
        completed: allInstancesCompleted
      }).eq('id', goal.originalId).eq('user_id', user.id);
      toast({
        title: "Meta actualizada",
        description: wasCompleted ? "Meta marcada como pendiente." : "¡Meta completada!."
      });
    } catch (error: any) {
      console.error('Error in toggleGoal:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la meta.",
        variant: "destructive"
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
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile
      const {
        data: profile
      } = await supabase.from('profiles').select('abstinence_start_date').eq('user_id', user.id).single();
      
      let diffDays = 0;
      if (profile?.abstinence_start_date) {
        const absDate = new Date(profile.abstinence_start_date);
        setStartDate(absDate);
        
        // Calculate sobriety days
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - absDate.getTime());
        diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        setSobrietyDays(diffDays);
      }

      // Fetch saved quotes
      const { data: quotes } = await supabase
        .from('saved_quotes')
        .select('*')
        .eq('user_id', user.id);
      if (quotes) {
        setSavedQuotes(quotes);
        const saved = quotes.some(
          (sq: any) => sq.quote_text === dailyQuote.text && sq.quote_author === dailyQuote.author
        );
        setIsQuoteSaved(saved);
      }

      // Fetch medals
      const { data: userMedals } = await supabase
        .from('medals')
        .select('*')
        .eq('user_id', user.id);
      
      if (userMedals) {
        setMedals(userMedals);
      }

      // Check and unlock medals based on sobriety days
      await checkAndUnlockMedals(user.id, diffDays, userMedals || []);

      // Fetch today's check-in
      const today = new Date().toISOString().split('T')[0];
      const {
        data: checkIn
      } = await supabase.from('check_ins').select('*').eq('user_id', user.id).eq('check_in_date', today).maybeSingle();
      if (checkIn) {
        setCheckInCompleted(true);
        const reminder = checkIn.answers['3'];
        if (reminder) setTodayReminder(reminder);
      }

      // Fetch today's goals (including 'always' type), ordered by order_index
      const {
        data: goals,
        error: goalsError
      } = await supabase.from('goals').select('*').eq('user_id', user.id).order('order_index', {
        ascending: true
      });
      if (goals && goals.length > 0) {
        // Filter goals that should appear today
        const todayGoals = goals.filter(g => g.goal_type === 'today' || g.goal_type === 'week' || g.goal_type === 'always');

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
              period: g.goal_type === 'today' ? 'Hoy' : g.goal_type === 'always' ? 'Pendiente' : 'Esta semana',
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
        const {
          data: {
            user
          }
        } = await supabase.auth.getUser();
        if (!user) return;
        const {
          data: profile
        } = await supabase.from('profiles').select('abstinence_start_date').eq('user_id', user.id).single();
        if (profile?.abstinence_start_date) {
          setStartDate(new Date(profile.abstinence_start_date));
        }
      };
      loadDate();
    };
    window.addEventListener('abstinenceDateUpdated', handleDateUpdate);

    // Set up realtime subscription for goal completions
    const channel = supabase.channel('goal_completions_changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'goal_completions'
    }, async payload => {
      // Only update if the change is from another device/session
      const todayStr = getLocalDateString();
      const completedInstances = await loadCompletedInstances(todayStr);

      // Update only the completion status without refetching everything
      setActiveGoals(prev => prev.map(g => ({
        ...g,
        status: completedInstances.has(g.id) ? 'completed' : 'pending'
      })));
      setGoalsCompleted(prev => {
        const newCompleted = Array.from(completedInstances).filter(id => activeGoals.some(g => g.id === id)).length;
        return newCompleted + (checkInCompleted ? 1 : 0);
      });
    }).subscribe();
    return () => {
      window.removeEventListener('abstinenceDateUpdated', handleDateUpdate);
      supabase.removeChannel(channel);
    };
  }, []);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = activeGoals.findIndex((goal) => goal.id === active.id);
    const newIndex = activeGoals.findIndex((goal) => goal.id === over.id);

    // Optimistically update UI
    const newGoals = arrayMove(activeGoals, oldIndex, newIndex);
    setActiveGoals(newGoals);

    // Save new order to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get unique original goal IDs in the new order
      const uniqueGoalIds = Array.from(new Set(newGoals.map(g => g.originalId)));
      
      // Update order_index for each unique goal
      const updates = uniqueGoalIds.map((goalId, index) => 
        supabase
          .from('goals')
          .update({ order_index: index })
          .eq('id', goalId)
          .eq('user_id', user.id)
      );

      await Promise.all(updates);
    } catch (error) {
      console.error('Error updating goal order:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el orden de las metas.",
        variant: "destructive",
      });
      // Revert on error
      const revertedGoals = arrayMove(newGoals, newIndex, oldIndex);
      setActiveGoals(revertedGoals);
    }
  };

  const toggleSaveQuote = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para guardar frases.",
          variant: "destructive",
        });
        return;
      }

      if (isQuoteSaved) {
        // Remove from saved
        const quoteToRemove = savedQuotes.find(
          (sq: any) => sq.quote_text === dailyQuote.text && sq.quote_author === dailyQuote.author
        );
        
        if (quoteToRemove) {
          const { error } = await supabase
            .from('saved_quotes')
            .delete()
            .eq('id', quoteToRemove.id);

          if (error) throw error;

        toast({
          title: (
            <span className="flex items-start justify-between w-full">
              <span>Frase eliminada</span>
              <span className="text-lg ml-2">🗑️</span>
            </span>
          ) as any,
          description: "La frase ha sido eliminada de tus guardados.",
        });
          
          setSavedQuotes(savedQuotes.filter((sq: any) => sq.id !== quoteToRemove.id));
          setIsQuoteSaved(false);
        }
      } else {
        // Add to saved
        const { error } = await supabase
          .from('saved_quotes')
          .insert({
            user_id: user.id,
            quote_text: dailyQuote.text,
            quote_author: dailyQuote.author
          });

        if (error) throw error;

        toast({
          title: "Frase guardada",
          description: "La frase ha sido guardada exitosamente.",
        });
        
        setIsQuoteSaved(true);
      }
    } catch (error: any) {
      toast({
        title: (
          <span className="flex items-start justify-between w-full">
            <span>Error</span>
            <span className="text-lg ml-2">⚠️</span>
          </span>
        ) as any,
        description: "No se pudo guardar la frase.",
        variant: "destructive",
      });
    }
  };

  // Check and unlock medals
  const checkAndUnlockMedals = async (userId: string, days: number, currentMedals: any[]) => {
    const medalsToCheck = [
      { type: 'valor', days: 0, name: 'Valor', emoji: '🥉' },
      { type: 'constancia', days: 40, name: 'Constancia', emoji: '🥈' },
      { type: 'recuperacion', days: 90, name: 'Recuperación', emoji: '🥇' },
      { type: 'servicio', days: 180, name: 'Servicio', emoji: '🏆' }
    ];

    for (const medal of medalsToCheck) {
      const alreadyHas = currentMedals.some(m => m.medal_type === medal.type);
      
      if (!alreadyHas && days >= medal.days) {
        // Unlock medal
        const { data, error } = await supabase
          .from('medals')
          .insert({
            user_id: userId,
            medal_type: medal.type,
            popup_shown: false
          })
          .select()
          .single();

        if (data && !error) {
          setMedals(prev => [...prev, data]);
          
          // Show popup if not shown before
          if (!data.popup_shown && medal.days > 0) {
            setNewMedal({ type: medal.type, name: medal.name, emoji: medal.emoji });
            setShowMedalPopup(true);
            
            // Mark popup as shown
            await supabase
              .from('medals')
              .update({ popup_shown: true })
              .eq('id', data.id);
          }
        }
      }
    }
  };

  const closeMedalPopup = () => {
    setShowMedalPopup(false);
    setNewMedal(null);
  };

  // Medal configuration
  const medalConfig = [
    { type: 'valor', name: 'Valor', emoji: '🥉', requiredDays: 0 },
    { type: 'constancia', name: 'Constancia', emoji: '🥈', requiredDays: 40 },
    { type: 'recuperacion', name: 'Recuperación', emoji: '🥇', requiredDays: 90 },
    { type: 'servicio', name: 'Libertad', emoji: '🏆', requiredDays: 180 }
  ];

  const getMedalStatus = (medalType: string, requiredDays: number) => {
    const isUnlocked = medals.some(m => m.medal_type === medalType);
    const progress = sobrietyDays;
    const remaining = Math.max(0, requiredDays - progress);
    
    return {
      isUnlocked,
      progress,
      remaining,
      opacity: isUnlocked ? 'opacity-100' : 'opacity-30'
    };
  };

  // Quick tools - configurable
  const quickTools = [{
    emoji: "🫁",
    label: "Respiración guiada",
    path: "/tools",
    color: "text-primary"
  }, {
    emoji: "📔",
    label: "Diario",
    path: "/journal",
    color: "text-primary"
  }, {
    emoji: "📞",
    label: "Mi red de apoyo",
    path: "/support-network",
    color: "text-accent"
  }, {
    emoji: "🚨",
    label: "Plan de emergencia",
    path: "/tools",
    color: "text-destructive"
  }];

  // Sortable Goal Item Component
  function SortableGoalItem({ goal }: { goal: any }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: goal.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/50"
      >
        <div className="flex items-center gap-3 flex-1">
          <button
            {...attributes}
            {...listeners}
            className="flex-shrink-0 cursor-grab active:cursor-grabbing touch-none"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </button>
          <button onClick={() => toggleGoal(goal.id)} className="flex-shrink-0">
            {goal.status === "completed" ? (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            ) : (
              <Circle className="h-6 w-6 text-muted-foreground" />
            )}
          </button>
          <div>
            <p className="font-semibold text-foreground">{goal.title}</p>
            <p
              className={`text-sm ${
                goal.status === "completed"
                  ? "text-green-500"
                  : "text-muted-foreground"
              }`}
            >
              {goal.status === "completed" ? "Completado" : goal.period}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <div className="container mx-auto px-[15px] pt-4 pb-8 max-w-4xl space-y-6 animate-in fade-in duration-500">
      {/* Header - Abstinence Counter */}
      <AbstinenceCounter startDate={startDate} />

      {/* Daily Progress Panel */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Progreso diario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Goals Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-muted-foreground">Metas completadas hoy:</p>
              <p className="text-sm font-bold text-green-500">{goalsCompleted} de {totalGoals}</p>
            </div>
            <Progress value={goalsProgress} className="h-3 [&>div]:bg-green-500" />
          </div>

          {/* Daily Check-In Status */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/50">
            <div className="flex items-center gap-3">
              <button className="flex-shrink-0 cursor-default">
                {checkInCompleted ? <CheckCircle2 className="h-6 w-6 text-green-500" /> : <Circle className="h-6 w-6 text-muted-foreground" />}
              </button>
              <div>
                <p className="font-semibold text-foreground">Check-in diario</p>
                <p className={`text-sm ${checkInCompleted ? "text-green-500" : "text-muted-foreground"}`}>
                  {checkInCompleted ? "Completado" : "Pendiente"}
                </p>
              </div>
            </div>
            {checkInCompleted ? <Link to="/checkin">
                <Button size="sm" variant="outline" className="rounded-xl">Editar</Button>
              </Link> : <Link to="/checkin">
                <Button size="sm" className="rounded-xl">Registrar</Button>
              </Link>}
          </div>

          {/* Today's Reminder */}
          {checkInCompleted && todayReminder && <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/50">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Hoy elijo recordarme que:</p>
                <p className="text-lg font-semibold text-green-500">{todayReminder}</p>
              </div>
            </div>}
        </CardContent>
      </Card>

      {/* Daily Reflection */}
      <Card className="border-sky-blue/30 bg-white dark:bg-gradient-to-br dark:from-sky-blue/10 dark:to-transparent">
        <CardContent className="p-6">
          <h3 className="font-semibold text-foreground mb-3">💡 Reflexión del día</h3>
          <p className="text-foreground/80">
            {getReflectionOfTheDay()}
          </p>
        </CardContent>
      </Card>

      {/* Active Goals Summary */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold">Metas activas</CardTitle>
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={activeGoals.map(g => g.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {activeGoals.map((goal) => (
                    <SortableGoalItem key={goal.id} goal={goal} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Quick Tools */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-foreground">Herramientas rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickTools.map(tool => {
          return <Link key={tool.label} to={tool.path}>
                <Card className="hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-pointer border-border/50 h-full">
                  <CardContent className="p-5 text-center space-y-3">
                    <div className={`mx-auto w-12 h-12 rounded-2xl bg-sky-blue flex items-center justify-center ${tool.color}`}>
                      <span className="text-2xl">{tool.emoji}</span>
                    </div>
                    <p className="font-semibold text-foreground text-xs leading-tight">{tool.label}</p>
                  </CardContent>
                </Card>
              </Link>;
        })}
        </div>
      </div>

      {/* Medals Widget */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold">Mis medallas</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {medalConfig.map(medal => {
              const status = getMedalStatus(medal.type, medal.requiredDays);
              return (
                <Card key={medal.type} className="border-border/50 h-full">
                  <CardContent className="p-4 md:p-6 flex items-center gap-3 md:gap-4">
                    <div className={`w-16 md:w-20 h-16 md:h-20 rounded-2xl bg-sky-blue flex items-center justify-center flex-shrink-0 ${status.opacity} transition-opacity duration-300`}>
                      <span className="text-3xl md:text-4xl">{medal.emoji}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-foreground text-base md:text-lg mb-1 md:mb-2">{medal.name}</p>
                      <p className={`text-sm ${status.isUnlocked ? 'text-green-500 font-semibold' : 'text-muted-foreground'}`}>
                        {status.isUnlocked 
                          ? '¡Conseguido!' 
                          : `+ ${status.progress} / ${medal.requiredDays} días.`
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Daily Motivational Message */}
      <Card className="border-sky-blue/30 bg-gradient-to-br from-sky-blue/10 to-transparent relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSaveQuote}
          className="absolute top-4 right-4 h-10 w-10 z-10"
        >
          <Star className={`h-5 w-5 ${isQuoteSaved ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
        </Button>
        <CardContent className="p-6 pt-12">
          <p className="text-center text-foreground text-xl font-medium leading-relaxed mb-2">
            "{dailyQuote.text}"
          </p>
          <p className="text-center text-muted-foreground text-sm">— {dailyQuote.author}</p>
          <div className="flex justify-center mt-4">
            <Link to="/message">
              <Button variant="ghost" size="sm" className="text-primary text-xs">Ver mensajes guardados.</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Medal Unlock Popup */}
      <AlertDialog open={showMedalPopup} onOpenChange={setShowMedalPopup}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center animate-scale-in">
                <span className="text-6xl">{newMedal?.emoji}</span>
              </div>
            </div>
            <AlertDialogTitle className="text-center text-2xl">
              ¡Conseguido!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-lg">
              <span className="font-bold text-primary">{sobrietyDays} días libre!</span>
              <br />
              Has desbloqueado la medalla <span className="font-semibold">{newMedal?.name}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-center mt-4">
            <Button onClick={closeMedalPopup} className="rounded-xl">
              <PartyPopper className="mr-2 h-4 w-4" />
              ¡Genial!
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
}