import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Check, Pencil, Trash2, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getEmotionCategories } from "@/utils/emotionCategories";
import { translateEmotion } from "@/utils/translateEmotion";

interface TertiaryEmotion {
  name: string;
}

interface SecondaryEmotion {
  id: string;
  name: string;
  tertiaryEmotions: string[];
}

interface PrimaryCategory {
  id: string;
  name: string;
  secondaryEmotions: SecondaryEmotion[];
}

interface SavedEmotionEntry {
  id: string;
  primary_emotion: string;
  secondary_emotions: string[];
  tertiary_emotions: string[];
  entry_date: string;
  created_at: string;
  situation_trigger: boolean;
  situation_description: string | null;
  person_trigger: boolean;
  person_description: string | null;
  situations?: any[];
  persons?: any[];
  thoughts?: any[];
  beliefs?: any[];
}

interface EmotionStats {
  name: string;
  count: number;
}

const COLORS = [
  '#00d084',  // Verde esmeralda
  '#ff6b35',  // Naranja rojizo
  '#004aad',  // Azul marino
  '#b300b3',  // Magenta
  '#ff1493',  // Rosa fucsia
  '#ffd700',  // Dorado
  '#00ced1',  // Turquesa
  '#8b4513',  // Marrón
  '#32cd32',  // Verde lima
  '#ff4500',  // Rojo anaranjado
  '#4169e1',  // Azul real
  '#9370db',  // Púrpura medio
  '#ff69b4',  // Rosa caliente
  '#daa520',  // Vara de oro
  '#20b2aa'   // Verde mar claro
];

export default function EmotionJournal() {
  const { t } = useTranslation();
  const emotionCategories = getEmotionCategories(t);
  const [selectedPrimary, setSelectedPrimary] = useState<string[]>([]);
  const [selectedSecondary, setSelectedSecondary] = useState<string[]>([]);
  const [selectedTertiary, setSelectedTertiary] = useState<string[]>([]);
  const [situationTrigger, setSituationTrigger] = useState<boolean | null>(null);
  const [situationDescription, setSituationDescription] = useState("");
  const [personTrigger, setPersonTrigger] = useState<boolean | null>(null);
  const [personDescription, setPersonDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedEntries, setSavedEntries] = useState<SavedEmotionEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [weekStats, setWeekStats] = useState<EmotionStats[]>([]);
  const [monthStats, setMonthStats] = useState<EmotionStats[]>([]);
  const [quarterStats, setQuarterStats] = useState<EmotionStats[]>([]);
  const [thoughtTrigger, setThoughtTrigger] = useState<boolean | null>(null);
  const [thoughtDescription, setThoughtDescription] = useState("");
  const [beliefTrigger, setBeliefTrigger] = useState<boolean | null>(null);
  const [beliefDescription, setBeliefDescription] = useState("");
  const { toast } = useToast();
  
  const ENTRIES_PER_PAGE = 3;

  useEffect(() => {
    loadSavedEntries();
    fetchStats();
  }, []);

  const loadSavedEntries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase as any)
        .from('emotion_journal')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false });

      if (error) throw error;

      setSavedEntries(data || []);
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      // Fetch stats for this week (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 6);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];
      await fetchStatsForPeriod(user.id, weekAgoStr, today, setWeekStats);

      // Fetch stats for this month
      const monthStart = new Date();
      monthStart.setDate(1);
      const monthStartStr = monthStart.toISOString().split('T')[0];
      await fetchStatsForPeriod(user.id, monthStartStr, today, setMonthStats);

      // Fetch stats for this quarter (last 90 days)
      const quarterAgo = new Date();
      quarterAgo.setDate(quarterAgo.getDate() - 89);
      const quarterAgoStr = quarterAgo.toISOString().split('T')[0];
      await fetchStatsForPeriod(user.id, quarterAgoStr, today, setQuarterStats);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchStatsForPeriod = async (
    userId: string,
    startDate: string,
    endDate: string,
    setStat: (stats: EmotionStats[]) => void
  ) => {
    const { data, error } = await (supabase as any)
      .from('emotion_journal')
      .select('primary_emotion, secondary_emotions, tertiary_emotions')
      .eq('user_id', userId)
      .gte('entry_date', startDate)
      .lte('entry_date', endDate);

    if (error) {
      console.error('Error fetching period stats:', error);
      return;
    }

    const targetLang = t('common.yes') === 'Yes' ? 'en' : 'es';

    // Count occurrences of each emotion
    const countMap = new Map<string, number>();
    
    (data || []).forEach((entry: any) => {
      // Count primary emotions
      if (entry.primary_emotion) {
        const primaries = entry.primary_emotion.split(", ");
        primaries.forEach((emotion: string) => {
          const trimmed = emotion.trim();
          const translated = translateEmotion(trimmed, targetLang);
          countMap.set(translated, (countMap.get(translated) || 0) + 1);
        });
      }
      
      // Count secondary emotions
      if (entry.secondary_emotions) {
        entry.secondary_emotions.forEach((emotion: string) => {
          const translated = translateEmotion(emotion, targetLang);
          countMap.set(translated, (countMap.get(translated) || 0) + 1);
        });
      }
      
      // Count tertiary emotions
      if (entry.tertiary_emotions) {
        entry.tertiary_emotions.forEach((emotion: string) => {
          const translated = translateEmotion(emotion, targetLang);
          countMap.set(translated, (countMap.get(translated) || 0) + 1);
        });
      }
    });

    const stats: EmotionStats[] = Array.from(countMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 emotions

    setStat(stats);
  };

  const togglePrimary = (categoryId: string) => {
    setSelectedPrimary(prev => {
      if (prev.includes(categoryId)) {
        // Remove primary and its related secondary/tertiary
        const category = emotionCategories.find(c => c.id === categoryId);
        const secondaryIdsToRemove = category?.secondaryEmotions.map(e => e.id) || [];
        setSelectedSecondary(current => current.filter(id => !secondaryIdsToRemove.includes(id)));
        
        // Remove tertiary emotions that belong to this category
        const tertiaryToRemove: string[] = [];
        category?.secondaryEmotions.forEach(sec => {
          tertiaryToRemove.push(...sec.tertiaryEmotions);
        });
        setSelectedTertiary(current => current.filter(t => !tertiaryToRemove.includes(t)));
        
        return prev.filter(id => id !== categoryId);
      } else {
        // Add new primary
        return [...prev, categoryId];
      }
    });
  };

  const toggleSecondary = (emotionId: string) => {
    setSelectedSecondary(prev => {
      if (prev.includes(emotionId)) {
        // Remove secondary emotion and its tertiary emotions
        const allCategories = emotionCategories.filter(c => selectedPrimary.includes(c.id));
        let tertiaryToRemove: string[] = [];
        allCategories.forEach(cat => {
          const emotion = cat.secondaryEmotions.find(e => e.id === emotionId);
          if (emotion) {
            tertiaryToRemove = emotion.tertiaryEmotions;
          }
        });
        setSelectedTertiary(current => 
          current.filter(t => !tertiaryToRemove.includes(t))
        );
        return prev.filter(id => id !== emotionId);
      } else {
        return [...prev, emotionId];
      }
    });
  };

  const toggleTertiary = (tertiaryEmotion: string) => {
    setSelectedTertiary(prev => 
      prev.includes(tertiaryEmotion)
        ? prev.filter(e => e !== tertiaryEmotion)
        : [...prev, tertiaryEmotion]
    );
  };

  // Generate hashtags from title only
  const generateHashtags = (title: string, content: string, emotionName: string): string[] => {
    // Add title-based hashtag (remove spaces, convert to lowercase)
    const titleTag = title.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/ñ/g, 'n');
    
    return [titleTag];
  };

  const handleSubmit = async () => {
    if (selectedPrimary.length === 0) {
      toast({
        title: t('emotionJournal.error'),
        description: t('emotionJournal.mustSelectPrimary'),
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: t('emotionJournal.error'),
          description: t('emotionJournal.mustSignIn'),
          variant: "destructive"
        });
        return;
      }

      // Get all primary category names
      const primaryNames = selectedPrimary
        .map(id => emotionCategories.find(c => c.id === id)?.name)
        .filter(Boolean)
        .join(", ");

      // Get secondary emotion names
      const allCategories = emotionCategories.filter(c => selectedPrimary.includes(c.id));
      const secondaryNames = selectedSecondary
        .map(id => {
          for (const category of allCategories) {
            const emotion = category.secondaryEmotions.find(e => e.id === id);
            if (emotion) return emotion.name;
          }
          return null;
        })
        .filter(Boolean) as string[];

      const { error } = await (supabase as any)
        .from('emotion_journal')
        .insert({
          user_id: user.id,
          primary_emotion: primaryNames,
          secondary_emotions: secondaryNames,
          tertiary_emotions: selectedTertiary,
          entry_date: new Date().toISOString().split('T')[0]
        });

      if (error) throw error;

      // Save situation as journal entry if provided
      if (situationTrigger && situationDescription.trim()) {
        const tags = generateHashtags(t('emotionJournal.limitSituations'), situationDescription.trim(), primaryNames);
        await (supabase as any)
          .from('journal_entries')
          .insert({
            user_id: user.id,
            title: t('emotionJournal.limitSituations'),
            content: situationDescription.trim(),
            tags,
            entry_date: new Date().toISOString().split('T')[0]
          });
      }

      // Save person as journal entry if provided
      if (personTrigger && personDescription.trim()) {
        const tags = generateHashtags(t('emotionJournal.peopleWhoTriggerMe'), personDescription.trim(), primaryNames);
        await (supabase as any)
          .from('journal_entries')
          .insert({
            user_id: user.id,
            title: t('emotionJournal.peopleWhoTriggerMe'),
            content: personDescription.trim(),
            tags,
            entry_date: new Date().toISOString().split('T')[0]
          });
      }

      // Save thought as journal entry if provided
      if (thoughtTrigger && thoughtDescription.trim()) {
        const tags = generateHashtags(t('emotionJournal.automaticThoughts'), thoughtDescription.trim(), primaryNames);
        await (supabase as any)
          .from('journal_entries')
          .insert({
            user_id: user.id,
            title: t('emotionJournal.automaticThoughts'),
            content: thoughtDescription.trim(),
            tags,
            entry_date: new Date().toISOString().split('T')[0]
          });
      }

      // Save belief as journal entry if provided
      if (beliefTrigger && beliefDescription.trim()) {
        const tags = generateHashtags(t('emotionJournal.falseBelief'), beliefDescription.trim(), primaryNames);
        await (supabase as any)
          .from('journal_entries')
          .insert({
            user_id: user.id,
            title: t('emotionJournal.falseBelief'),
            content: beliefDescription.trim(),
            tags,
            entry_date: new Date().toISOString().split('T')[0]
          });
      }

      if (error) throw error;

      // Check if any optional responses were saved
      const hasOptionalResponses = 
        (situationTrigger && situationDescription.trim()) ||
        (personTrigger && personDescription.trim()) ||
        (thoughtTrigger && thoughtDescription.trim()) ||
        (beliefTrigger && beliefDescription.trim());

      toast({
        title: t('emotionJournal.saved'),
        description: t('emotionJournal.emotionsSavedSuccess')
      });

      // Show additional toast if optional responses were saved
      if (hasOptionalResponses) {
        setTimeout(() => {
          toast({
            title: t('emotionJournal.responseSaved'),
            description: t('emotionJournal.responseSavedDescription')
          });
        }, 500);
      }

      setSelectedPrimary([]);
      setSelectedSecondary([]);
      setSelectedTertiary([]);
      setSituationTrigger(null);
      setSituationDescription("");
      setPersonTrigger(null);
      setPersonDescription("");
      setThoughtTrigger(null);
      setThoughtDescription("");
      setBeliefTrigger(null);
      setBeliefDescription("");
      await loadSavedEntries();
      await fetchStats();
    } catch (error) {
      console.error('Error saving emotions:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar tu entrada.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (entry: SavedEmotionEntry) => {
    setEditingEntry(entry.id);
    
    // Parse primary emotions (may be comma-separated)
    const primaryNames = entry.primary_emotion.split(", ");
    const primaryIds: string[] = [];
    primaryNames.forEach(name => {
      const category = emotionCategories.find(c => c.name === name.trim());
      if (category) primaryIds.push(category.id);
    });
    
    setSelectedPrimary(primaryIds);
    
    // Map secondary emotion names to IDs
    const allCategories = emotionCategories.filter(c => primaryIds.includes(c.id));
    const secondaryIds: string[] = [];
    entry.secondary_emotions.forEach(name => {
      for (const category of allCategories) {
        const emotion = category.secondaryEmotions.find(e => e.name === name);
        if (emotion) {
          secondaryIds.push(emotion.id);
          break;
        }
      }
    });
    
    setSelectedSecondary(secondaryIds);
    setSelectedTertiary(entry.tertiary_emotions);
    
    // Reset optional responses
    setSituationTrigger(null);
    setSituationDescription("");
    setPersonTrigger(null);
    setPersonDescription("");
    setThoughtTrigger(null);
    setThoughtDescription("");
    setBeliefTrigger(null);
    setBeliefDescription("");
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdate = async () => {
    if (!editingEntry) return;

    if (selectedPrimary.length === 0) {
      toast({
        title: t('emotionJournal.error'),
        description: t('emotionJournal.mustSelectPrimary'),
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      // Get all primary category names
      const primaryNames = selectedPrimary
        .map(id => emotionCategories.find(c => c.id === id)?.name)
        .filter(Boolean)
        .join(", ");

      // Get secondary emotion names
      const allCategories = emotionCategories.filter(c => selectedPrimary.includes(c.id));
      const secondaryNames = selectedSecondary
        .map(id => {
          for (const category of allCategories) {
            const emotion = category.secondaryEmotions.find(e => e.id === id);
            if (emotion) return emotion.name;
          }
          return null;
        })
        .filter(Boolean) as string[];
      
      const { error } = await (supabase as any)
        .from('emotion_journal')
        .update({
          primary_emotion: primaryNames,
          secondary_emotions: secondaryNames,
          tertiary_emotions: selectedTertiary
        })
        .eq('id', editingEntry);

      if (error) throw error;

      toast({
        title: "Actualizado",
        description: "Tu entrada ha sido actualizada exitosamente."
      });

      setEditingEntry(null);
      setSelectedPrimary([]);
      setSelectedSecondary([]);
      setSelectedTertiary([]);
      setSituationTrigger(null);
      setSituationDescription("");
      setPersonTrigger(null);
      setPersonDescription("");
      setThoughtTrigger(null);
      setThoughtDescription("");
      setBeliefTrigger(null);
      setBeliefDescription("");
      await loadSavedEntries();
      await fetchStats();
    } catch (error) {
      console.error('Error updating entry:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar tu entrada.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    setDeleteConfirmId(null);
    try {
      const { error } = await (supabase as any)
        .from('emotion_journal')
        .delete()
        .eq('id', entryId);

      if (error) throw error;

      toast({
        title: "Eliminado",
        description: "La entrada ha sido eliminada."
      });

      await loadSavedEntries();
      await fetchStats();
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la entrada.",
        variant: "destructive"
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setSelectedPrimary([]);
    setSelectedSecondary([]);
    setSelectedTertiary([]);
    setSituationTrigger(null);
    setSituationDescription("");
    setPersonTrigger(null);
    setPersonDescription("");
    setThoughtTrigger(null);
    setThoughtDescription("");
    setBeliefTrigger(null);
    setBeliefDescription("");
  };

  // Get all selected categories
  const selectedCategories = emotionCategories.filter(c => selectedPrimary.includes(c.id));
  
  // Get all secondary emotions from selected categories with their primary category info
  const allSecondaryEmotionsWithParent = selectedCategories.flatMap(cat => 
    cat.secondaryEmotions.map(emotion => ({
      ...emotion,
      primaryCategory: cat.name
    }))
  );
  
  // Get selected secondary emotions data (sorted alphabetically)
  const selectedSecondaryData = allSecondaryEmotionsWithParent
    .filter(e => selectedSecondary.includes(e.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Filter entries by date if a filter date is selected
  const filteredEntries = filterDate
    ? savedEntries.filter(entry => {
        const entryDate = new Date(entry.entry_date);
        const filterDateStr = `${filterDate.getFullYear()}-${String(filterDate.getMonth() + 1).padStart(2, '0')}-${String(filterDate.getDate()).padStart(2, '0')}`;
        return entry.entry_date === filterDateStr;
      })
    : savedEntries;

  // Pagination
  const totalPages = Math.ceil(filteredEntries.length / ENTRIES_PER_PAGE);
  const startIndex = (currentPage - 1) * ENTRIES_PER_PAGE;
  const endIndex = startIndex + ENTRIES_PER_PAGE;
  const currentEntries = filteredEntries.slice(startIndex, endIndex);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterDate]);

  const renderDonutChart = (data: EmotionStats[]) => {
    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          {t('emotionJournal.noDataForPeriod')}
        </div>
      );
    }

    const total = data.reduce((sum, item) => sum + item.count, 0);

    return (
      <div className="w-full pt-6 lg:pt-0">
        <ResponsiveContainer width="100%" height={400} className="lg:h-[320px]">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="count"
              label={(entry) => `${((entry.count / total) * 100).toFixed(1)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number, name: string) => {
                const percentage = ((value / total) * 100).toFixed(1);
                return [`${percentage}% (${value} ${t('emotionJournal.times')})`, name];
              }}
            />
            <Legend 
              verticalAlign="bottom"
              layout="horizontal"
              align="center"
              wrapperStyle={{ 
                paddingTop: '25px',
                fontSize: '17px',
                maxHeight: '200px',
                overflowY: 'auto',
                lineHeight: '2'
              }}
              iconSize={15}
              formatter={(value) => value}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="space-y-[30px] animate-fade-in">
      <Card className="p-8 bg-card border-border">
        <div className="space-y-8">
          {/* Primary Categories */}
          <div>
            <h2 className="text-lg lg:text-xl font-bold text-foreground mb-[24px]">{t('emotionJournal.howDoYouFeel')}</h2>
            <div className="flex flex-col lg:flex-row items-start lg:flex-wrap gap-3">
              {emotionCategories.map((category) => {
                const isSelected = selectedPrimary.includes(category.id);
                return (
                  <Button
                    key={category.id}
                    variant="outline"
                    size="lg"
                    onClick={() => togglePrimary(category.id)}
                    className={`rounded-full px-6 h-12 text-xl lg:text-lg font-medium transition-all ${
                      isSelected
                        ? "bg-green-600 hover:bg-green-700 text-white border-green-600" 
                        : "hover:bg-primary/10 hover:border-primary/50"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-4 flex items-center justify-center">
                        {isSelected ? <Check className="h-4 w-4" /> : <span>+</span>}
                      </span>
                      <span>{category.name}</span>
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Secondary Emotions - Grouped by Primary Category */}
          {selectedPrimary.length > 0 && selectedCategories.some(cat => cat.secondaryEmotions.length > 0) && (
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">{t('emotionJournal.iHaveFelt')}</h2>
              <div className="flex flex-col gap-6">
                {[...selectedPrimary].reverse().map((categoryId) => {
                  const category = emotionCategories.find(c => c.id === categoryId);
                  if (!category) return null;
                  
                  return (
                    <div key={categoryId}>
                      <h3 className="text-lg font-medium text-green-600 mb-3">{category.name}</h3>
                      <div className="flex flex-col lg:flex-row items-start lg:flex-wrap gap-3">
                        {category.secondaryEmotions.map((emotion) => {
                          const isSelected = selectedSecondary.includes(emotion.id);
                          return (
                            <Button
                              key={emotion.id}
                              variant="outline"
                              size="lg"
                              onClick={() => toggleSecondary(emotion.id)}
                              className={`rounded-full px-6 h-12 text-xl lg:text-lg font-medium transition-all flex-shrink-0 ${
                                isSelected 
                                  ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
                                  : "hover:bg-primary/10 hover:border-primary/50"
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span className="w-4 flex items-center justify-center">
                                  {isSelected ? <Check className="h-4 w-4" /> : <span>+</span>}
                                </span>
                                <span>{emotion.name}</span>
                              </span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tertiary Emotions */}
          {selectedSecondary.length > 0 && selectedSecondaryData.some(emotion => emotion.tertiaryEmotions.length > 0) && (
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">{t('emotionJournal.atDeeperLevel')}</h2>
              <div className="flex flex-col gap-6">
                {selectedSecondaryData.map((emotion) => (
                  <div key={emotion.id}>
                    <h3 className="text-lg font-medium text-green-600 mb-3">{emotion.primaryCategory} - {emotion.name}</h3>
                    <div className="flex flex-col lg:flex-row items-start lg:flex-wrap gap-3">
                      {emotion.tertiaryEmotions.map((tertiaryEmotion) => {
                        const isSelected = selectedTertiary.includes(tertiaryEmotion);
                        return (
                          <Button
                            key={tertiaryEmotion}
                            variant="outline"
                            size="lg"
                            onClick={() => toggleTertiary(tertiaryEmotion)}
                            className={`rounded-full px-6 h-12 text-xl lg:text-lg font-medium transition-all flex-shrink-0 ${
                              isSelected 
                                ? "bg-green-600 hover:bg-green-700 text-white border-green-600" 
                                : "hover:bg-primary/10 hover:border-primary/50"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span className="w-4 flex items-center justify-center">
                                {isSelected ? <Check className="h-4 w-4" /> : <span>+</span>}
                              </span>
                              <span>{tertiaryEmotion}</span>
                            </span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Additional Questions */}
        {selectedPrimary.length > 0 && (
          <div className="space-y-6 mt-8 pt-6 border-t">
            <h2 className="text-lg lg:text-xl font-bold text-foreground mb-6">{t('emotionJournal.optionalQuestions')}</h2>
            
            {/* Situation Question */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">
                {t('emotionJournal.wasTriggeredBy')}
              </h3>
              <div className="flex gap-3">
                <Button
                  variant={situationTrigger === true ? "default" : "outline"}
                  onClick={() => {
                    setSituationTrigger(true);
                    if (situationTrigger !== true) setSituationDescription("");
                  }}
                  className={`rounded-full px-6 ${situationTrigger === true ? "bg-success text-success-foreground hover:bg-success/90" : ""}`}
                >
                  {t('common.yes')}
                </Button>
                <Button
                  variant={situationTrigger === false ? "default" : "outline"}
                  onClick={() => {
                    setSituationTrigger(false);
                    setSituationDescription("");
                  }}
                  className="rounded-full px-6"
                >
                  {t('common.no')}
                </Button>
              </div>
              {situationTrigger === true && (
                <div className="space-y-2">
                  <Textarea
                    value={situationDescription}
                    onChange={(e) => setSituationDescription(e.target.value)}
                    placeholder={t('emotionJournal.describeSituation')}
                    className="min-h-[100px] resize-none"
                  />
                </div>
              )}
            </div>

            {/* Person Question */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">
                {t('emotionJournal.wasPersonInvolved')}
              </h3>
              <div className="flex gap-3">
                <Button
                  variant={personTrigger === true ? "default" : "outline"}
                  onClick={() => {
                    setPersonTrigger(true);
                    if (personTrigger !== true) setPersonDescription("");
                  }}
                  className={`rounded-full px-6 ${personTrigger === true ? "bg-success text-success-foreground hover:bg-success/90" : ""}`}
                >
                  {t('common.yes')}
                </Button>
                <Button
                  variant={personTrigger === false ? "default" : "outline"}
                  onClick={() => {
                    setPersonTrigger(false);
                    setPersonDescription("");
                  }}
                  className="rounded-full px-6"
                >
                  {t('common.no')}
                </Button>
              </div>
              {personTrigger === true && (
                <div className="space-y-2">
                  <Textarea
                    value={personDescription}
                    onChange={(e) => setPersonDescription(e.target.value)}
                    placeholder={t('emotionJournal.describePersonPlaceholder')}
                    className="min-h-[100px] resize-none"
                  />
                </div>
              )}
            </div>

            {/* Thought Question */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">
                {t('emotionJournal.wasThought')}
              </h3>
              <div className="flex gap-3">
                <Button
                  variant={thoughtTrigger === true ? "default" : "outline"}
                  onClick={() => {
                    setThoughtTrigger(true);
                    if (thoughtTrigger !== true) setThoughtDescription("");
                  }}
                  className={`rounded-full px-6 ${thoughtTrigger === true ? "bg-success text-success-foreground hover:bg-success/90" : ""}`}
                >
                  {t('common.yes')}
                </Button>
                <Button
                  variant={thoughtTrigger === false ? "default" : "outline"}
                  onClick={() => {
                    setThoughtTrigger(false);
                    setThoughtDescription("");
                  }}
                  className="rounded-full px-6"
                >
                  {t('common.no')}
                </Button>
              </div>
              {thoughtTrigger === true && (
                <div className="space-y-2">
                  <Textarea
                    value={thoughtDescription}
                    onChange={(e) => setThoughtDescription(e.target.value)}
                    placeholder={t('emotionJournal.describeThoughtPlaceholder')}
                    className="min-h-[100px] resize-none"
                  />
                </div>
              )}
            </div>

            {/* Belief Question */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">
                {t('emotionJournal.wasBelief')}
              </h3>
              <div className="flex gap-3">
                <Button
                  variant={beliefTrigger === true ? "default" : "outline"}
                  onClick={() => {
                    setBeliefTrigger(true);
                    if (beliefTrigger !== true) setBeliefDescription("");
                  }}
                  className={`rounded-full px-6 ${beliefTrigger === true ? "bg-success text-success-foreground hover:bg-success/90" : ""}`}
                >
                  {t('common.yes')}
                </Button>
                <Button
                  variant={beliefTrigger === false ? "default" : "outline"}
                  onClick={() => {
                    setBeliefTrigger(false);
                    setBeliefDescription("");
                  }}
                  className="rounded-full px-6"
                >
                  {t('common.no')}
                </Button>
              </div>
              {beliefTrigger === true && (
                <div className="space-y-2">
                  <Textarea
                    value={beliefDescription}
                    onChange={(e) => setBeliefDescription(e.target.value)}
                    placeholder={t('emotionJournal.describeBeliefPlaceholder')}
                    className="min-h-[100px] resize-none"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Save/Update Button */}
        {selectedPrimary.length > 0 && (
          <div className="flex justify-start lg:justify-end gap-4 mt-6">
            {editingEntry && (
              <Button
                size="lg"
                variant="outline"
                onClick={handleCancelEdit}
                className="rounded-full px-6 h-12 text-xl lg:text-sm font-medium"
              >
                {t('common.cancel')}
              </Button>
            )}
            <Button
              size="lg"
              variant="accent"
              onClick={editingEntry ? handleUpdate : handleSubmit}
              disabled={isSaving}
              className="rounded-full px-6 h-12 text-xl lg:text-sm font-medium"
            >
              {isSaving ? (editingEntry ? `${t('common.edit')}...` : `${t('common.save')}...`) : (editingEntry ? t('common.edit') : t('common.save'))}
            </Button>
          </div>
        )}
      </Card>

      {/* Emotion Log Widget */}
      {savedEntries.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg lg:text-xl font-bold text-foreground pl-[10px] lg:pl-8">
              <span className="lg:hidden">{t('emotionJournal.emotionLog')}</span>
              <span className="hidden lg:inline">{t('emotionJournal.emotionLog')}</span>
            </h2>
            
            {/* Date Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal pl-[15px]",
                    !filterDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filterDate ? format(filterDate, "d 'de' MMMM, yyyy", { locale: es }) : t('emotionJournal.filterByDate')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={filterDate}
                  onSelect={setFilterDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
                {filterDate && (
                  <div className="p-3 pb-6 border-t">
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => setFilterDate(undefined)}
                    >
                      {t('emotionJournal.clearFilter')}
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-4">
            {filteredEntries.length > 0 ? (
              currentEntries.map((entry) => (
              <Card key={entry.id} className="p-6 bg-card border-border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {format(new Date(entry.created_at), t('emotionJournal.dateFormat'), { locale: t('common.yes') === 'Yes' ? enUS : es })}
                    </span>
                  </div>
                  <div className="flex gap-2 mr-[10px] lg:mr-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(entry)}
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteConfirmId(entry.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 px-2">
                  {entry.primary_emotion && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">{t('emotionJournal.iHaveFeltLog')}</h3>
                      <div className="flex flex-wrap gap-2">
                        {entry.primary_emotion.split(", ").sort().map((emotion, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 rounded-full bg-green-600/20 text-green-600 text-sm font-medium"
                          >
                            {emotion.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {entry.secondary_emotions && entry.secondary_emotions.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">{t('emotionJournal.alsoFeltLog')}</h3>
                      <div className="flex flex-wrap gap-2">
                        {[...entry.secondary_emotions].sort().map((emotion, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 rounded-full bg-green-600/20 text-green-600 text-sm font-medium"
                          >
                            {emotion}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {entry.tertiary_emotions && entry.tertiary_emotions.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">{t('emotionJournal.andAtDeeperLevelLog')}</h3>
                      <div className="flex flex-wrap gap-2">
                        {[...entry.tertiary_emotions].sort().map((emotion, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 rounded-full bg-green-600/20 text-green-600 text-sm"
                          >
                            {emotion}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Optional Responses Section */}
                  {(entry.situations?.length > 0 || entry.persons?.length > 0 || entry.thoughts?.length > 0 || entry.beliefs?.length > 0) && (
                    <div className="mt-6 pt-4 border-t border-border">
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3">{t('emotionJournal.optionalResponses')}</h3>
                      <div className="space-y-3">
                        {entry.situations?.map((situation: any) => (
                          <div key={situation.id} className="bg-muted/30 p-3 rounded-lg">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              {t('emotionJournal.wasTriggeredBy')}
                            </p>
                            <p className="text-sm text-foreground">{situation.description}</p>
                          </div>
                        ))}
                        
                        {entry.persons?.map((person: any) => (
                          <div key={person.id} className="bg-muted/30 p-3 rounded-lg">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              {t('emotionJournal.wasPersonInvolved')}
                            </p>
                            <p className="text-sm text-foreground">{person.description}</p>
                          </div>
                        ))}
                        
                        {entry.thoughts?.map((thought: any) => (
                          <div key={thought.id} className="bg-muted/30 p-3 rounded-lg">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              {t('emotionJournal.wasThought')}
                            </p>
                            <p className="text-sm text-foreground">{thought.description}</p>
                          </div>
                        ))}
                        
                        {entry.beliefs?.map((belief: any) => (
                          <div key={belief.id} className="bg-muted/30 p-3 rounded-lg">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              {t('emotionJournal.wasBelief')}
                            </p>
                            <p className="text-sm text-foreground">{belief.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))
            ) : (
              <Card className="p-6 bg-card border-border">
                <p className="text-center text-muted-foreground">
                  {t('emotionJournal.noEntriesForDate')}
                </p>
              </Card>
            )}
          </div>
          
          {/* Pagination Controls */}
          {filteredEntries.length > ENTRIES_PER_PAGE && (
            <div className="flex items-center justify-center gap-2 mt-6">
              {currentPage > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="h-9 w-9 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              
              <span className="text-sm text-muted-foreground px-4">
                {t('emotionJournal.pageOf')} {currentPage} {t('emotionJournal.of')} {totalPages}
              </span>
              
              {currentPage < totalPages && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="h-9 w-9 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Statistics Widget */}
      {savedEntries.length > 0 && (
        <Card className="border-sky-blue/20 pl-[14px]">
          <CardHeader>
            <CardTitle className="text-2xl">
              {t('emotionJournal.statistics')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="week" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="week">{t('emotionJournal.thisWeek')}</TabsTrigger>
                <TabsTrigger value="month">{t('emotionJournal.thisMonth')}</TabsTrigger>
                <TabsTrigger value="quarter">{t('emotionJournal.thisQuarter')}</TabsTrigger>
              </TabsList>
              <TabsContent value="week" className="mt-6">
                {renderDonutChart(weekStats)}
              </TabsContent>
              <TabsContent value="month" className="mt-6">
                {renderDonutChart(monthStats)}
              </TabsContent>
              <TabsContent value="quarter" className="mt-6">
                {renderDonutChart(quarterStats)}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Quick Tools */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4 text-foreground pl-5">{t('emotionJournal.quickAccess')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[15px]">
          <Link to="/journal">
            <Card className="hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-pointer border-sidebar-border h-full">
              <CardContent className="p-5 text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center text-primary" style={{ backgroundColor: '#d5def7' }}>
                  <span className="text-2xl">📔</span>
                </div>
                <p className="font-semibold text-foreground text-sm leading-tight">{t('journal.title')}</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/emotion-journal">
            <Card className="hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-pointer border-sidebar-border h-full">
              <CardContent className="p-5 text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center text-primary" style={{ backgroundColor: '#d5def7' }}>
                  <span className="text-2xl">😊</span>
                </div>
                <p className="font-semibold text-foreground text-sm leading-tight">{t('emotionJournal.emotionDiary')}</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/gratitude">
            <Card className="hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-pointer border-sidebar-border h-full">
              <CardContent className="p-5 text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center text-accent" style={{ backgroundColor: '#d5def7' }}>
                  <span className="text-2xl">🙏</span>
                </div>
                <p className="font-semibold text-foreground text-sm leading-tight">{t('gratitude.title')}</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/tools">
            <Card className="hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-pointer border-sidebar-border h-full">
              <CardContent className="p-5 text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center text-destructive" style={{ backgroundColor: '#d5def7' }}>
                  <span className="text-2xl">🚨</span>
                </div>
                <p className="font-semibold text-foreground text-sm leading-tight">{t('quickTools.emergencyPlan')}</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('emotionJournal.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('emotionJournal.confirmDeleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>
              {t('emotionJournal.yes')}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
