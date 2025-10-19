import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Pencil, Trash2, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

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
}

interface EmotionStats {
  name: string;
  count: number;
}

const COLORS = ['#22c55e', '#f97316', '#3b82f6', '#a855f7', '#ec4899', '#eab308', '#14b8a6'];

const emotionCategories: PrimaryCategory[] = [
  {
    id: "alegre",
    name: "Alegre",
    secondaryEmotions: [
      {
        id: "descansado",
        name: "Descansado",
        tertiaryEmotions: ["Renovado", "Restaurado", "Revitalizado", "Revivido"]
      },
      {
        id: "energico",
        name: "Enérgico",
        tertiaryEmotions: []
      },
      {
        id: "entusiasmado",
        name: "Entusiasmado",
        tertiaryEmotions: ["Animado", "Ansioso", "Apasionado", "Ardiente", "Asombrado", "Deslumbrado", "Emocionado", "Enérgico", "Entusiasta", "Sorprendido", "Vibrante", "Vigorizado"]
      },
      {
        id: "esperanzado",
        name: "Esperanzado",
        tertiaryEmotions: ["Alentado", "Expectante", "Optimista"]
      },
      {
        id: "euforico",
        name: "Eufórico",
        tertiaryEmotions: ["Arrebatado", "Dichoso", "Embelesado", "Emocionado", "Exaltado", "Extático", "Exuberante", "Hechizado", "Radiante"]
      },
      {
        id: "inspirado",
        name: "Inspirado",
        tertiaryEmotions: ["Admirado", "Asombrado", "Maravillado"]
      },
      {
        id: "pleno",
        name: "Pleno",
        tertiaryEmotions: ["Gratitud", "Paz", "Satisfacción", "Trascendencia"]
      }
    ]
  },
  {
    id: "confundido",
    name: "Confundido",
    secondaryEmotions: [
      {
        id: "desorientado",
        name: "Desorientado",
        tertiaryEmotions: ["Aturdido", "Desconcertado", "Perdido", "Perplejo"]
      }
    ]
  },
  {
    id: "vulnerable",
    name: "Inseguro",
    secondaryEmotions: [
      {
        id: "avergonzado",
        name: "Avergonzado",
        tertiaryEmotions: ["Avergonzado", "Cohibido", "Culpable", "Mortificado", "Turbado"]
      },
      {
        id: "desconfiado",
        name: "Desconfiado",
        tertiaryEmotions: []
      },
      {
        id: "incomodo",
        name: "Incómodo",
        tertiaryEmotions: ["Incómodo", "Inquieto", "Intranquilo", "Molesto", "Nervioso"]
      },
      {
        id: "inquieto",
        name: "Inquieto",
        tertiaryEmotions: ["Agitación", "Agitado", "Alarmado", "Alterado", "Conmocionado", "Desconcertado", "Inquieto", "Perturbado", "Preocupado", "Sobresaltado", "Sorprendido", "Turbulento"]
      },
      {
        id: "vulnerable",
        name: "Vulnerable",
        tertiaryEmotions: ["Cauteloso", "Frágil", "Indefenso", "Inseguro", "Reservado", "Sensible", "Tembloroso"]
      },
      {
        id: "desconectado",
        name: "Desconectado",
        tertiaryEmotions: ["Aburrido", "Adormecido", "Alejado", "Alienado", "Apático", "Desapegado", "Desinteresado", "Distante", "Distraído", "Frío", "Indiferente", "Retraído"]
      }
    ]
  },
  {
    id: "irritado",
    name: "Irritado",
    secondaryEmotions: [
      {
        id: "aburrido",
        name: "Aburrido",
        tertiaryEmotions: ["Indiferencia", "Apático", "Impaciencia"]
      },
      {
        id: "enojado",
        name: "Enojado",
        tertiaryEmotions: ["Enfurecido", "Furioso", "Indignado", "Iracundo", "Lívido", "Resentido", "Ultrajado"]
      },
      {
        id: "frustracion",
        name: "Frustrado",
        tertiaryEmotions: ["Impotente"]
      },
      {
        id: "molesto",
        name: "Molesto",
        tertiaryEmotions: ["Descontento", "Disgustado", "Exasperado", "Frustrado", "Herido", "Impaciente"]
      }
    ]
  },
  {
    id: "miedo",
    name: "Miedo",
    secondaryEmotions: [
      {
        id: "asustado",
        name: "Asustado",
        tertiaryEmotions: ["Aprensivo", "Asustado", "Atemorizado", "Aterrorizado", "Cauteloso", "Desconfiado", "En pánico", "Petrificado", "Preocupado", "Presentimiento", "Sospechoso", "Temor"]
      },
      {
        id: "preocupado",
        name: "Preocupado",
        tertiaryEmotions: ["Angustia", "Aprensión", "Desesperación", "Estrés", "Impaciencia"]
      },
      {
        id: "tenso",
        name: "Tenso",
        tertiaryEmotions: ["Abrumado", "Angustiado", "Ansioso", "Consternado", "Estresado", "Inquieto", "Irritable", "Nervioso"]
      }
    ]
  },
  {
    id: "conectado",
    name: "Seguro",
    secondaryEmotions: [
      {
        id: "abierto",
        name: "Abierto",
        tertiaryEmotions: ["Accesible", "Disponible", "Receptivo", "Sincero", "Transparente"]
      },
      {
        id: "afectuoso",
        name: "Afectuoso",
        tertiaryEmotions: ["Amigable", "Amoroso", "Cálido", "Compasivo", "De corazón abierto", "Simpático", "Tierno"]
      },
      {
        id: "agradecido",
        name: "Agradecido",
        tertiaryEmotions: ["Alegría suave", "Asombro", "Calidez", "Generosidad", "Humildad", "Reconocimiento"]
      },
      {
        id: "comprometido",
        name: "Comprometido",
        tertiaryEmotions: ["Absorto", "Alerta", "Curioso", "Encantado", "Estimulado", "Fascinado", "Interesado", "Intrigado", "Involucrado"]
      },
      {
        id: "seguro",
        name: "Conectado",
        tertiaryEmotions: ["Aceptación", "Calma", "Confianza", "Feliz", "Intimidad", "Pertenencia", "Previsibilidad", "Tranquilidad"]
      },
      {
        id: "confiado",
        name: "Confiado",
        tertiaryEmotions: ["Abierto", "Empoderado", "Orgulloso", "Protegido", "Seguro"]
      },
      {
        id: "despreocupado",
        name: "Despreocupado",
        tertiaryEmotions: ["Optimismo", "Serenidad", "Tranquilidad"]
      },
      {
        id: "pacifico",
        name: "Pacífico",
        tertiaryEmotions: ["Aliviado", "Calmado", "Centrado", "Cómodo", "Confiado", "Contento", "Despejado", "Ecuánime", "Quieto", "Realizado", "Relajado", "Satisfecho", "Sereno", "Tranquilo"]
      },
      {
        id: "seguro",
        name: "Conectado",
        tertiaryEmotions: ["Aceptación", "Calma", "Confianza", "Feliz", "Intimidad", "Pertenencia", "Previsibilidad", "Tranquilidad"]
      },
      {
        id: "estabilidad",
        name: "Estabilidad",
        tertiaryEmotions: ["Arraigo", "Coherencia", "Resiliencia", "Equilibrio"]
      }
    ]
  },
  {
    id: "cansado",
    name: "Triste",
    secondaryEmotions: [
      {
        id: "abandono",
        name: "Abandono",
        tertiaryEmotions: []
      },
      {
        id: "desanimado",
        name: "Desanimado",
        tertiaryEmotions: []
      },
      {
        id: "agotado",
        name: "Agotado",
        tertiaryEmotions: []
      },
      {
        id: "cansado_sub",
        name: "Cansado",
        tertiaryEmotions: []
      },
      {
        id: "dolor",
        name: "Dolor",
        tertiaryEmotions: ["Afligido", "Agonía", "Angustiado", "Arrepentido", "Desconsolado", "Devastado", "Duelo", "Herido", "Miserable", "Remordido", "Solo"]
      },
      {
        id: "fatigado",
        name: "Fatigado",
        tertiaryEmotions: ["Agotado", "Apático", "Cansado", "Exhausto", "Fatigado", "Letárgico", "Quemado", "Somnoliento"]
      },
      {
        id: "triste",
        name: "Infeliz",
        tertiaryEmotions: ["Abatido", "Decepcionado", "Deprimido", "Desalentado", "Descorazonado", "Desdichado", "Desesperado", "Desolado", "Infeliz", "Melancólico", "Sin esperanza", "Sombrío"]
      },
      {
        id: "rechazo",
        name: "Rechazo",
        tertiaryEmotions: ["Animosidad", "Desagrado", "Desprecio", "Disgustado", "Horrorizado", "Hostil", "Odio", "Repulsado"]
      }
    ]
  }
];

export default function EmotionJournal() {
  const [selectedPrimary, setSelectedPrimary] = useState<string[]>([]);
  const [selectedSecondary, setSelectedSecondary] = useState<string[]>([]);
  const [selectedTertiary, setSelectedTertiary] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedEntries, setSavedEntries] = useState<SavedEmotionEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [weekStats, setWeekStats] = useState<EmotionStats[]>([]);
  const [monthStats, setMonthStats] = useState<EmotionStats[]>([]);
  const [quarterStats, setQuarterStats] = useState<EmotionStats[]>([]);
  const { toast } = useToast();
  
  const ENTRIES_PER_PAGE = 6;

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

    // Count occurrences of each emotion
    const countMap = new Map<string, number>();
    
    (data || []).forEach((entry: any) => {
      // Count primary emotions
      if (entry.primary_emotion) {
        const primaries = entry.primary_emotion.split(", ");
        primaries.forEach((emotion: string) => {
          const trimmed = emotion.trim();
          countMap.set(trimmed, (countMap.get(trimmed) || 0) + 1);
        });
      }
      
      // Count secondary emotions
      if (entry.secondary_emotions) {
        entry.secondary_emotions.forEach((emotion: string) => {
          countMap.set(emotion, (countMap.get(emotion) || 0) + 1);
        });
      }
      
      // Count tertiary emotions
      if (entry.tertiary_emotions) {
        entry.tertiary_emotions.forEach((emotion: string) => {
          countMap.set(emotion, (countMap.get(emotion) || 0) + 1);
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

  const handleSubmit = async () => {
    if (selectedPrimary.length === 0) {
      toast({
        title: "Error",
        description: "Debes seleccionar al menos una categoría principal.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para guardar tus emociones.",
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

      toast({
        title: "Guardado",
        description: "Tus emociones han sido registradas exitosamente"
      });

      setSelectedPrimary([]);
      setSelectedSecondary([]);
      setSelectedTertiary([]);
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
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdate = async () => {
    if (!editingEntry) return;

    if (selectedPrimary.length === 0) {
      toast({
        title: "Error",
        description: "Debes seleccionar al menos una categoría principal.",
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
  };

  // Get all selected categories
  const selectedCategories = emotionCategories.filter(c => selectedPrimary.includes(c.id));
  
  // Get all secondary emotions from selected categories
  const allSecondaryEmotions = selectedCategories.flatMap(cat => cat.secondaryEmotions);
  
  // Get selected secondary emotions data (sorted alphabetically)
  const selectedSecondaryData = allSecondaryEmotions
    .filter(e => selectedSecondary.includes(e.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Filter entries by date if a filter date is selected
  const filteredEntries = filterDate
    ? savedEntries.filter(entry => {
        const entryDate = new Date(entry.entry_date);
        return entryDate.toDateString() === filterDate.toDateString();
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
          No hay datos para este período
        </div>
      );
    }

    const total = data.reduce((sum, item) => sum + item.count, 0);

    return (
      <div className="w-full">
        <ResponsiveContainer width="100%" height={400} className="lg:h-[320px]">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="35%"
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
                return [`${percentage}% (${value} veces)`, name];
              }}
            />
            <Legend 
              verticalAlign="bottom"
              layout="horizontal"
              align="center"
              wrapperStyle={{ 
                paddingTop: '10px',
                fontSize: '12px',
                maxHeight: '150px',
                overflowY: 'auto'
              }}
              iconSize={10}
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
            <h2 className="text-lg lg:text-xl font-bold text-foreground mb-[24px]">¿Cómo te sientes aquí y ahora?</h2>
            <div className="flex flex-col lg:flex-row items-start lg:flex-wrap gap-3">
              {emotionCategories.map((category) => {
                const isSelected = selectedPrimary.includes(category.id);
                return (
                  <Button
                    key={category.id}
                    variant="outline"
                    size="lg"
                    onClick={() => togglePrimary(category.id)}
                    className={`rounded-full px-6 h-12 text-xl lg:text-sm font-medium transition-all ${
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
          {selectedPrimary.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">Me he sentido:</h2>
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
                              className={`rounded-full px-6 h-12 text-xl lg:text-sm font-medium transition-all flex-shrink-0 ${
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
          {selectedSecondary.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">Y a nivel más profundo:</h2>
              <div className="flex flex-col gap-6">
                {selectedSecondaryData.map((emotion) => (
                  <div key={emotion.id}>
                    <h3 className="text-lg font-medium text-green-600 mb-3">{emotion.name}</h3>
                    <div className="flex flex-col lg:flex-row items-start lg:flex-wrap gap-3">
                      {emotion.tertiaryEmotions.map((tertiaryEmotion) => {
                        const isSelected = selectedTertiary.includes(tertiaryEmotion);
                        return (
                          <Button
                            key={tertiaryEmotion}
                            variant="outline"
                            size="lg"
                            onClick={() => toggleTertiary(tertiaryEmotion)}
                            className={`rounded-full px-6 h-12 text-xl lg:text-sm font-medium transition-all flex-shrink-0 ${
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
                Cancelar
              </Button>
            )}
            <Button
              size="lg"
              onClick={editingEntry ? handleUpdate : handleSubmit}
              disabled={isSaving}
              className="rounded-full px-6 h-12 text-xl lg:text-sm font-medium bg-primary hover:bg-primary/90"
            >
              {isSaving ? (editingEntry ? "Actualizando..." : "Guardando...") : (editingEntry ? "Actualizar" : "Guardar")}
            </Button>
          </div>
        )}
      </Card>

      {/* Emotion Log Widget */}
      {savedEntries.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg lg:text-xl font-bold text-foreground pl-[10px] lg:pl-8">
              <span className="lg:hidden">Registro:</span>
              <span className="hidden lg:inline">Registro de emociones:</span>
            </h2>
            
            {/* Date Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !filterDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filterDate ? format(filterDate, "d 'de' MMMM, yyyy", { locale: es }) : "Buscar por fecha"}
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
                  <div className="p-3 border-t">
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => setFilterDate(undefined)}
                    >
                      Limpiar filtro
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
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {format(new Date(entry.created_at), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
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
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Me he sentido:</h3>
                      <span className="px-3 py-1 rounded-full bg-green-600/20 text-green-600 text-sm font-medium">
                        {entry.primary_emotion}
                      </span>
                    </div>
                  )}

                  {entry.secondary_emotions && entry.secondary_emotions.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">También he sentido:</h3>
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
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Y a nivel más profundo:</h3>
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
                </div>
              </Card>
            ))
            ) : (
              <Card className="p-6 bg-card border-border">
                <p className="text-center text-muted-foreground">
                  No hay entradas para la fecha seleccionada.
                </p>
              </Card>
            )}
          </div>
          
          {/* Pagination Controls */}
          {filteredEntries.length > ENTRIES_PER_PAGE && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-9 w-9 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="text-sm text-muted-foreground px-4">
                Página {currentPage} de {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="h-9 w-9 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Statistics Widget */}
      {savedEntries.length > 0 && (
        <Card className="border-sky-blue/20">
          <CardHeader>
            <CardTitle className="text-2xl">
              Estadísticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="week" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="week">Esta semana</TabsTrigger>
                <TabsTrigger value="month">Este mes</TabsTrigger>
                <TabsTrigger value="quarter">Trimestre</TabsTrigger>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar esta entrada? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>
              Sí
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
