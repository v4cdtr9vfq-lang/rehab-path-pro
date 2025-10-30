import { AbstinenceCounter } from "@/components/AbstinenceCounter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Clock, Circle, Star, GripVertical, PartyPopper, Plus } from "lucide-react";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "react-i18next";
import { useTranslatedQuickTools } from "@/hooks/useTranslatedQuickTools";
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
  const { t, i18n } = useTranslation();
  const quickTools = useTranslatedQuickTools();
  // Normalize language to 'en' or 'es'
  const currentLanguage = i18n.language.startsWith('en') ? 'en' : 'es';
  console.log('Dashboard - i18n.language:', i18n.language, 'normalized:', currentLanguage);
  
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
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
  const [currentAddictionId, setCurrentAddictionId] = useState<string>('original');
  const [showMedalPopup, setShowMedalPopup] = useState(false);
  const [newMedal, setNewMedal] = useState<{type: string, name: string, emoji: string} | null>(null);
  const [sobrietyDays, setSobrietyDays] = useState(0);
  const [hasUnsavedOrder, setHasUnsavedOrder] = useState(false);
  const [originalGoalsOrder, setOriginalGoalsOrder] = useState<any[]>([]);
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [bedtime, setBedtime] = useState<string>('21:00');
  const [wakeUpTime, setWakeUpTime] = useState<string>('07:00');
  const allQuotes = [{
    text: t('quotes.1'),
    author: "Amelia Barr"
  }, {
    text: t('quotes.2'),
    author: "Lincoln Chafee"
  }, {
    text: t('quotes.3'),
    author: "Lao Tzu"
  }, {
    text: t('quotes.4'),
    author: "Nelson Mandela"
  }, {
    text: t('quotes.5'),
    author: "Robert Collier"
  }, {
    text: t('quotes.6'),
    author: "Muhammad Ali"
  }, {
    text: t('quotes.7'),
    author: t('common.anonymous')
  }, {
    text: t('quotes.8'),
    author: t('common.unknown')
  }, {
    text: t('quotes.9'),
    author: "Rikki Rogers"
  }, {
    text: t('quotes.10'),
    author: t('common.anonymous')
  }];

  // Get quote of the day based on date
  const getQuoteOfTheDay = () => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    return allQuotes[dayOfYear % allQuotes.length];
  };
  const dailyQuote = getQuoteOfTheDay();
  
  // Get translated reflections
  const reflections = [
    t('reflections.1'),
    t('reflections.2'),
    t('reflections.3'),
    t('reflections.4'),
    t('reflections.5'),
    t('reflections.6'),
    t('reflections.7'),
    t('reflections.8')
  ];

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
      if (!goal) {
        console.warn('Goal not found:', goalId);
        return;
      }
      
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
      
      if (!user) {
        console.error('User not authenticated');
        toast({
          title: t('goals.error'),
          description: 'Sesión expirada. Por favor, inicia sesión de nuevo.',
          variant: "destructive"
        });
        return;
      }
      
      const instancesOfThisGoal = updatedGoals.filter(g => g.originalId === goal.originalId);
      const completedInstancesOfGoal = instancesOfThisGoal.filter(g => g.status === 'completed').length;
      const allInstancesCompleted = completedInstancesOfGoal === instancesOfThisGoal.length;
      
      const { error } = await supabase.from('goals').update({
        completed: allInstancesCompleted
      }).eq('id', goal.originalId).eq('user_id', user.id);
      
      if (error) {
        console.error('Error updating goal:', error);
        throw error;
      }
      
      toast({
        title: t('goals.goalUpdated'),
        description: wasCompleted ? t('goals.markedAsPending') : t('goals.goalCompleted')
      });
    } catch (error: any) {
      console.error('Error in toggleGoal:', error);
      toast({
        title: t('goals.error'),
        description: error.message || t('goals.couldNotUpdate'),
        variant: "destructive"
      });
      // Revert optimistic update on error
      try {
        const todayStr = getLocalDateString();
        const completedInstances = await loadCompletedInstances(todayStr);
        const revertedGoals = activeGoals.map(g => ({
          ...g,
          status: completedInstances.has(g.id) ? 'completed' : 'pending'
        }));
        setActiveGoals(revertedGoals);
      } catch (revertError) {
        console.error('Error reverting goal state:', revertError);
      }
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

      // Fetch medals for current addiction
      const { data: userMedals } = await supabase
        .from('medals')
        .select('*')
        .eq('user_id', user.id)
        .eq('addiction_id', currentAddictionId);
      
      if (userMedals) {
        setMedals(userMedals);
      }

      // Check and unlock medals based on sobriety days
      await checkAndUnlockMedals(user.id, diffDays, userMedals || [], currentAddictionId);

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

      // Fetch today's goals (including 'always' type), ordered by order_index, filtered by language
      const {
        data: goals,
        error: goalsError
      } = await supabase.from('goals').select('*').eq('user_id', user.id).eq('language', currentLanguage).order('order_index', {
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
              title: g.text, // No translation needed - already in correct language
              link: g.link,
              period: g.goal_type === 'today' ? t('goals.today') : g.goal_type === 'always' ? t('goals.always') : t('goals.thisWeek'),
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

      // Fetch today's sleep quality
      const { data: sleepData } = await supabase
        .from('sleep_quality')
        .select('quality_score')
        .eq('user_id', user.id)
        .eq('entry_date', today)
        .maybeSingle();
      
      if (sleepData) {
        setSleepQuality(sleepData.quality_score);
      }

      // Fetch sleep schedule from profile - always use preferred times
      const { data: profileData } = await supabase
        .from('profiles')
        .select('preferred_bedtime, preferred_wake_up_time')
        .eq('user_id', user.id)
        .single();
      
      if (profileData) {
        setBedtime(profileData.preferred_bedtime || '21:00');
        setWakeUpTime(profileData.preferred_wake_up_time || '07:00');
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

    // Set up realtime subscription for goal completions and order changes
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
    }).on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'goals'
    }, async (payload) => {
      // Listen for any goal changes and refresh if we don't have unsaved local changes
      if (!hasUnsavedOrder) {
        setTimeout(async () => {
          const {
            data: {
              user
            }
          } = await supabase.auth.getUser();
          if (!user) return;

          const {
            data: goals
          } = await supabase.from('goals').select('*').eq('user_id', user.id).eq('language', currentLanguage).order('order_index', {
            ascending: true
          });
          
          if (goals && goals.length > 0) {
            const todayGoals = goals.filter(g => g.goal_type === 'today' || g.goal_type === 'week' || g.goal_type === 'always');
            const todayStr = getLocalDateString();
            const completedInstances = await loadCompletedInstances(todayStr);
            const expandedGoals: any[] = [];
            
            todayGoals.forEach(g => {
              for (let i = 0; i < g.remaining; i++) {
                const instanceId = `${g.id}__${todayStr}__${i}`;
                expandedGoals.push({
                  id: instanceId,
                  originalId: g.id,
                  title: g.text, // No translation needed
                  link: g.link,
                  period: g.goal_type === 'today' ? t('goals.today') : g.goal_type === 'always' ? t('goals.always') : t('goals.thisWeek'),
                  status: completedInstances.has(instanceId) ? 'completed' : 'pending',
                  instanceIndex: i
                });
              }
            });
            
            setActiveGoals(expandedGoals);
          }
        }, 300);
      }
    }).subscribe();
    return () => {
      window.removeEventListener('abstinenceDateUpdated', handleDateUpdate);
      supabase.removeChannel(channel);
    };
  }, [currentAddictionId, i18n.language]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    // Save original order before first change
    if (!hasUnsavedOrder) {
      setOriginalGoalsOrder([...activeGoals]);
    }

    const oldIndex = activeGoals.findIndex((goal) => goal.id === active.id);
    const newIndex = activeGoals.findIndex((goal) => goal.id === over.id);

    // Only update UI locally, don't save yet
    const newGoals = arrayMove(activeGoals, oldIndex, newIndex);
    setActiveGoals(newGoals);
    setHasUnsavedOrder(true);
  };

  // Cancel reordering and restore original order
  const cancelReorder = () => {
    setActiveGoals(originalGoalsOrder);
    setHasUnsavedOrder(false);
    setOriginalGoalsOrder([]);
    toast({
      title: t('goals.changesCanceled'),
      description: t('goals.originalOrderRestored')
    });
  };

  // Save goal order to database
  const saveGoalOrder = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch ALL goals from the database to maintain global order
      const { data: allGoals, error: fetchError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('order_index', { ascending: true });

      if (fetchError) throw fetchError;
      if (!allGoals) return;

      // Get unique original goal IDs from currently displayed goals in new order
      const reorderedTodayGoalIds = Array.from(new Set(activeGoals.map(g => g.originalId)));
      
      // Create a map of goal IDs that are being displayed today
      const todayGoalsSet = new Set(reorderedTodayGoalIds);
      
      // Separate goals into those displayed today and those not displayed today
      const goalsNotDisplayedToday = allGoals.filter(g => !todayGoalsSet.has(g.id));
      
      // Build new order: first the reordered today goals, then the rest
      const newOrderedGoalIds = [
        ...reorderedTodayGoalIds,
        ...goalsNotDisplayedToday.map(g => g.id)
      ];
      
      // Update order_index for all goals
      const updates = newOrderedGoalIds.map((goalId, index) => 
        supabase
          .from('goals')
          .update({ order_index: index })
          .eq('id', goalId)
          .eq('user_id', user.id)
      );

      await Promise.all(updates);
      
      setHasUnsavedOrder(false);
      setOriginalGoalsOrder([]);
      toast({
        title: t('goals.orderSaved'),
        description: t('goals.orderUpdated')
      });
    } catch (error) {
      console.error('Error updating goal order:', error);
      toast({
        title: t('goals.error'),
        description: t('goals.couldNotSaveOrder'),
        variant: "destructive",
      });
    }
  };

  const toggleSaveQuote = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: t('goals.error'),
          description: t('errors.unauthorized'),
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
              <span>{t('quotes.removed')}</span>
              <span className="text-lg ml-2">🗑️</span>
            </span>
          ) as any,
          description: t('quotes.removed'),
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
          title: t('quotes.saved'),
          description: t('quotes.saved'),
        });
        
        setIsQuoteSaved(true);
      }
    } catch (error: any) {
      toast({
        title: (
          <span className="flex items-start justify-between w-full">
            <span>{t('goals.error')}</span>
            <span className="text-lg ml-2">⚠️</span>
          </span>
        ) as any,
        description: t('errors.genericError'),
        variant: "destructive",
      });
    }
  };

  // Check and unlock medals
  const checkAndUnlockMedals = useCallback(async (userId: string, days: number, currentMedals: any[], addictionId: string = 'original') => {
    const medalsToCheck = [
      { type: 'valor', days: 0, name: 'Valor', emoji: '🥉' },
      { type: 'constancia', days: 90, name: 'Constancia', emoji: '🥈' },
      { type: 'recuperacion', days: 180, name: 'Recuperación', emoji: '🥇' },
      { type: 'servicio', days: 360, name: 'Libertad', emoji: '🏆' }
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
            addiction_id: addictionId,
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
  }, []);

  const closeMedalPopup = () => {
    setShowMedalPopup(false);
    setNewMedal(null);
  };

  // Medal configuration
  const medalConfig = [
    { type: 'servicio', name: t('medals.freedom'), emoji: '🏆', requiredDays: 360 },
    { type: 'recuperacion', name: t('medals.recovery'), emoji: '🥇', requiredDays: 180 },
    { type: 'constancia', name: t('medals.perseverance'), emoji: '🥈', requiredDays: 90 },
    { type: 'valor', name: t('medals.courage'), emoji: '🥉', requiredDays: 0 }
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

  // Handle sleep quality selection
  const handleSleepQuality = async (score: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      // Try to update existing entry, if not exists, insert
      const { error: upsertError } = await supabase
        .from('sleep_quality')
        .upsert({
          user_id: user.id,
          entry_date: today,
          quality_score: score
        }, {
          onConflict: 'user_id,entry_date'
        });

      if (upsertError) throw upsertError;

      setSleepQuality(score);
      toast({
        title: t('checkIn.checkInSaved'),
        description: `${t('checkIn.sleepQuality')}: ${score}/10`,
      });
    } catch (error: any) {
      console.error('Error saving sleep quality:', error);
      toast({
        title: t('goals.error'),
        description: t('errors.genericError'),
        variant: "destructive",
      });
    }
  };

  // Handle bedtime change - updates preferred time
  const handleBedtimeChange = async (time: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ preferred_bedtime: time })
        .eq('user_id', user.id);

      if (error) throw error;

      setBedtime(time);
      toast({
        title: t('dashboard.scheduleUpdated'),
        description: `${t('dashboard.bedtime')}: ${time}`,
      });
    } catch (error: any) {
      console.error('Error saving bedtime:', error);
      toast({
        title: t('goals.error'),
        description: t('errors.genericError'),
        variant: "destructive",
      });
    }
  };

  // Handle wake up time change - updates preferred time
  const handleWakeUpTimeChange = async (time: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ preferred_wake_up_time: time })
        .eq('user_id', user.id);

      if (error) throw error;

      setWakeUpTime(time);
      toast({
        title: t('dashboard.scheduleUpdated'),
        description: `${t('dashboard.wakeUpTime')}: ${time}`,
      });
    } catch (error: any) {
      console.error('Error saving wake up time:', error);
      toast({
        title: t('goals.error'),
        description: t('errors.genericError'),
        variant: "destructive",
      });
    }
  };

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
        className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-muted/50 border border-sidebar-border"
      >
        <div className="flex items-center gap-2 md:gap-3 flex-1">
          <button onClick={() => toggleGoal(goal.id)} className="flex-shrink-0">
            {goal.status === "completed" ? (
              <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-green-500" />
            ) : (
              <Circle className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground" />
            )}
          </button>
          <button
            {...attributes}
            {...listeners}
            className="hidden md:flex flex-shrink-0 cursor-grab active:cursor-grabbing touch-none"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </button>
          <div>
            {goal.link ? (
              <a 
                href={goal.link} 
                className="font-semibold text-foreground text-sm md:text-base hover:text-green-600"
                onClick={(e) => e.stopPropagation()}
              >
                {goal.title}
              </a>
            ) : (
              <p className="font-semibold text-foreground text-sm md:text-base">{goal.title}</p>
            )}
            <p
              className={`text-xs md:text-sm ${
                goal.status === "completed"
                  ? "text-green-500"
                  : "text-muted-foreground"
              }`}
            >
              {goal.status === "completed" ? t('goals.completed') : t('goals.pending')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Handle addiction change from counter
  const handleAddictionChange = useCallback(async (addictionId: string, days: number) => {
    setCurrentAddictionId(addictionId);
    setSobrietyDays(days);
    
    // Load medals for this addiction
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userMedals } = await supabase
      .from('medals')
      .select('*')
      .eq('user_id', user.id)
      .eq('addiction_id', addictionId);
    
    if (userMedals) {
      setMedals(userMedals);
    }

    // Check and unlock medals for this addiction
    await checkAndUnlockMedals(user.id, days, userMedals || [], addictionId);
  }, [checkAndUnlockMedals]);

  return <div className="container mx-auto px-[15px] md:px-0 pt-4 md:pt-0 md:-mt-[3px] pb-8 space-y-[35px] animate-in fade-in duration-500">
      {/* Header - Abstinence Counter */}
      <div className="abstinence-counter">
        <AbstinenceCounter 
          startDate={startDate} 
          onAddictionChange={handleAddictionChange}
        />
      </div>

      {/* Daily Progress Panel */}
      <Card className="border-sidebar-border md:-mt-[3px]" data-tour="daily-progress">
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl font-bold pl-[10px]">{t('dashboard.dailyProgress')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Goals Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-muted-foreground pl-[10px]">{t('dashboard.goalsCompleted')}</p>
              <p className="text-sm font-bold text-green-500 pr-[10px]">{goalsCompleted} de {totalGoals}</p>
            </div>
            <Progress key="dashboard-progress" value={goalsProgress} className="h-3 [&>div]:bg-green-500" />
          </div>

          {/* Daily Check-In Status */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-sidebar-border">
            <div className="flex items-center gap-3">
              <button className="flex-shrink-0 cursor-default">
                {checkInCompleted ? <CheckCircle2 className="h-6 w-6 text-green-500" /> : <Circle className="h-6 w-6 text-muted-foreground" />}
              </button>
              <div>
                <p className="font-semibold text-foreground">
                  <span className="md:hidden">{t('dashboard.checkIn')}</span>
                  <span className="hidden md:inline">{t('dashboard.checkIn')}</span>
                </p>
                <p className={`text-sm ${checkInCompleted ? "text-green-500" : "text-muted-foreground"}`}>
                  {checkInCompleted ? t('dashboard.completed') : t('dashboard.pending')}
                </p>
              </div>
            </div>
            {checkInCompleted ? <Link to="/checkin">
                <Button size="sm" variant="outline" className="rounded-xl">{t('common.edit')}</Button>
              </Link> : <Link to="/checkin">
                <Button size="sm" className="rounded-xl">{t('dashboard.register')}</Button>
              </Link>}
          </div>

          {/* Today's Reminder */}
          {checkInCompleted && todayReminder && <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-sidebar-border">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t('dashboard.todayReminder')}</p>
                <p className="text-sm md:text-lg font-semibold text-green-500">{todayReminder}</p>
              </div>
            </div>}

          {/* Sleep Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-muted/50 border border-sidebar-border">
              <div className="flex flex-col md:flex-row md:items-center justify-center gap-2">
                <p className="text-sm text-muted-foreground whitespace-nowrap">{t('dashboard.fellAsleepAround')}</p>
                <select 
                  value={bedtime}
                  onChange={(e) => handleBedtimeChange(e.target.value)}
                  className="bg-background border border-sidebar-border rounded-lg px-3 py-2 pr-8 pl-[20px] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary appearance-none bg-no-repeat"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.25rem center',
                    backgroundSize: '1.5em 1.5em'
                  }}
                >
                  {Array.from({ length: 24 }, (_, i) => {
                    const hour = i.toString().padStart(2, '0');
                    return (
                      <option key={hour} value={`${hour}:00`}>
                        {`${hour}:00`}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
            
            <div className="p-4 rounded-xl bg-muted/50 border border-sidebar-border">
              <div className="flex flex-col md:flex-row md:items-center justify-center gap-2">
                <p className="text-sm text-muted-foreground whitespace-nowrap">{t('dashboard.wokeUpAround')}</p>
                <select 
                  value={wakeUpTime}
                  onChange={(e) => handleWakeUpTimeChange(e.target.value)}
                  className="bg-background border border-sidebar-border rounded-lg px-3 py-2 pr-8 pl-[20px] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary appearance-none bg-no-repeat"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.25rem center',
                    backgroundSize: '1.5em 1.5em'
                  }}
                >
                  {Array.from({ length: 24 }, (_, i) => {
                    const hour = i.toString().padStart(2, '0');
                    return (
                      <option key={hour} value={`${hour}:00`}>
                        {`${hour}:00`}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Goals Summary */}
      <Card className="border-sidebar-border md:-mt-[3px]" data-tour="goals-section">
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-[25px]">
          <CardTitle className="text-xl md:text-2xl font-bold pl-[10px]">{t('dashboard.todayGoals')}</CardTitle>
          <div className="flex gap-2">
            {hasUnsavedOrder && (
              <>
                <Button onClick={cancelReorder} variant="outline" size="sm">
                  {t('common.cancel')}
                </Button>
                <Button onClick={saveGoalOrder} variant="default" size="sm">
                  {t('common.save')}
                </Button>
              </>
            )}
            <Link to="/plan">
              <Button variant="ghost" size="sm" className="text-primary">{t('dashboard.viewAll')}</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {activeGoals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">{t('dashboard.noActiveGoals')}</p>
              <Link to="/plan">
                <Button size="icon" className="rounded-full h-12 w-12">
                  <Plus className="h-6 w-6" />
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {isMobile ? (
                <div className="space-y-3">
                  {activeGoals.map((goal) => (
                    <div
                      key={goal.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-sidebar-border"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <button onClick={() => toggleGoal(goal.id)} className="flex-shrink-0">
                          {goal.status === "completed" ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                        </button>
                        <div>
                          {goal.link ? (
                            <a 
                              href={goal.link} 
                              className="font-semibold text-foreground text-sm hover:text-green-600"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {goal.title}
                            </a>
                          ) : (
                            <p className="font-semibold text-foreground text-sm">{goal.title}</p>
                          )}
                          <p
                            className={`text-xs ${
                              goal.status === "completed"
                                ? "text-green-500"
                                : "text-muted-foreground"
                            }`}
                          >
                            {goal.status === "completed" ? t('goals.completed') : goal.period}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Daily Reflection */}
      <Card className="border-sidebar-border bg-gradient-to-br from-sky-blue/10 to-transparent md:-mt-[3px]">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">💡</span>
            <CardTitle className="text-lg md:text-2xl">{t('dashboard.reflectionOfTheDay')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-foreground/80 text-base md:text-lg leading-relaxed px-[15px]">
            {getReflectionOfTheDay()}
          </p>
          <Link to={`/journal?reflection=${encodeURIComponent(getReflectionOfTheDay())}`} className="block">
            <Button variant="outline" size="lg" className="w-full bg-background hover:bg-background/80">
              {t('dashboard.writeAboutThis')}
            </Button>
          </Link>
        </CardContent>
      </Card>


      {/* Medals Widget */}
      <Card className="border-sidebar-border md:-mt-[3px]">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl md:text-2xl font-bold pl-[10px]">{t('dashboard.myMedals')}</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 px-4 md:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 max-w-full">
            {medalConfig.map(medal => {
              const status = getMedalStatus(medal.type, medal.requiredDays);
              return (
                <Card key={medal.type} className="border-sidebar-border overflow-hidden">
                  <CardContent className="p-3 md:p-4 flex items-center gap-2 md:gap-3">
                    <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${status.opacity} transition-opacity duration-300`} style={{ backgroundColor: 'hsl(var(--medal-bg))' }}>
                      <span className="text-xl md:text-2xl">{medal.emoji}</span>
                    </div>
                    <div className="flex-1 overflow-hidden pr-2">
                      <p className="font-bold text-foreground text-sm md:text-base mb-0.5 break-words">{medal.name}</p>
                      <p className={`text-xs md:text-sm break-words ${medal.requiredDays === 0 || status.isUnlocked ? 'text-green-500 font-semibold' : 'text-muted-foreground'}`}>
                        {medal.requiredDays === 0
                          ? t('medals.unlocked')
                          : status.isUnlocked 
                            ? t('medals.unlocked')
                            : `+${status.progress} / ${medal.requiredDays} ${t('medals.daysClean')}.`
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
      <Card className="border-sidebar-border relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSaveQuote}
          className="absolute top-4 right-4 h-10 w-10 z-10"
        >
          <Star className={`h-5 w-5 ${isQuoteSaved ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
        </Button>
        <CardContent className="p-6 pt-12 flex flex-col justify-center min-h-[200px]">
          <p className="text-center text-foreground text-xl font-medium leading-relaxed mb-2">
            "{dailyQuote.text}"
          </p>
          <p className="text-center text-muted-foreground text-sm">— {dailyQuote.author}</p>
          <div className="flex justify-center mt-4">
            <Link to="/message">
              <Button variant="ghost" size="sm" className="text-primary text-xs">{t('quotes.viewSaved')}</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quick Tools */}
      <div data-tour="quick-tools">
        <h2 className="text-xl md:text-2xl font-bold mb-4 text-foreground pl-5">{t('dashboard.quickAccess')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[15px]">
          {quickTools.map(tool => {
          return <Link key={tool.label} to={tool.path}>
                <Card className="hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-pointer border-sidebar-border h-full">
                  <CardContent className="p-5 text-center space-y-3">
                    <div className={`mx-auto w-12 h-12 rounded-2xl flex items-center justify-center ${tool.color}`} style={{ backgroundColor: '#d5def7' }}>
                      <span className="text-2xl">{tool.emoji}</span>
                    </div>
                    <p className="font-semibold text-foreground text-sm leading-tight">{tool.label}</p>
                  </CardContent>
                </Card>
              </Link>;
        })}
        </div>
      </div>


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
              {t('medals.unlocked')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-lg">
              <span className="font-bold text-primary">{sobrietyDays} {t('medals.daysClean')}!</span>
              <br />
              {t('medals.youUnlocked')} <span className="font-semibold">{newMedal?.name}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-center mt-4">
            <Button onClick={closeMedalPopup} className="rounded-xl">
              <PartyPopper className="mr-2 h-4 w-4" />
              {t('medals.great')}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
}