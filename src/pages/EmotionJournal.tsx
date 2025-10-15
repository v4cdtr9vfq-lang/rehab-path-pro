import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Pencil, Trash2, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Emotion {
  id: string;
  name: string;
  subEmotions: string[];
}

interface SavedEmotionEntry {
  id: string;
  main_emotion: string;
  sub_emotions: string[];
  entry_date: string;
  created_at: string;
}

const emotions: Emotion[] = [
  {
    id: "afecto",
    name: "Afecto",
    subEmotions: ["Afectuosa", "Amorosa", "Cariñosa", "Compasiva", "Comprensiva", "Simpática", "Tierna"]
  },
  {
    id: "anhelo",
    name: "Anhelo",
    subEmotions: ["Añorada", "Celosa", "Deseosa", "Envidiosa", "Melancólica", "Nostálgica", "Sola"]
  },
  {
    id: "aversion",
    name: "Aversión",
    subEmotions: ["Asco", "Desdeñosa", "Horrorizada", "Desprecio", "Odio", "Repugnada"]
  },
  {
    id: "cansancio",
    name: "Cansancio",
    subEmotions: ["Abatida", "Agotada", "Cansada", "Débil", "Dolorida", "Fatigada", "Afligida", "Angustiada", "Desconsolada", "Deshecha"]
  },
  {
    id: "confianza",
    name: "Confianza",
    subEmotions: ["Capaz", "Confiada", "Fuerte", "Ilusionada", "Orgullosa", "Receptiva", "Segura"]
  },
  {
    id: "confusion",
    name: "Confusión",
    subEmotions: ["Bloqueada", "Confusa", "Desorientada", "Dividida", "Dudosa", "Escéptica", "Espesa", "Indecisa", "Paralizada", "Pensativa", "Perdida", "Perpleja", "Vacilante"]
  },
  {
    id: "desconexion",
    name: "Desconexión",
    subEmotions: ["Aburrida", "Afectada", "Aislada", "Apática", "Desconectada", "Desidiosa", "Distante", "Fría", "Indiferente"]
  },
  {
    id: "enfado",
    name: "Enfado",
    subEmotions: ["Disgustada", "Enfadada", "Furiosa", "Indignada", "Ira", "Molesta", "Resentida"]
  },
  {
    id: "entusiasmo",
    name: "Entusiasmo",
    subEmotions: ["Animada", "Apasionada", "Entusiasmada", "Estimulada", "Excitada", "Fascinada", "Ilusionada", "Impresionada", "Sorprendida"]
  },
  {
    id: "esperanza",
    name: "Esperanza",
    subEmotions: ["Alentada", "Esperanzada", "Expectante", "Optimista"]
  },
  {
    id: "euforia",
    name: "Euforia",
    subEmotions: ["Eufórica", "Exultante", "Efusiva"]
  },
  {
    id: "felicidad",
    name: "Felicidad",
    subEmotions: ["Alegre", "Complacida", "Feliz", "Gozosa", "Placentera"]
  },
  {
    id: "gratitud",
    name: "Gratitud",
    subEmotions: ["Agradecida", "Conmovida", "Emocionada", "Generosa", "Plena"]
  },
  {
    id: "inspiracion",
    name: "Inspiración",
    subEmotions: ["Impresionada", "Inspirada", "Maravillada", "Parada"]
  },
  {
    id: "inquietud",
    name: "Inquietud",
    subEmotions: ["Agitada", "Agobiada", "Alarmada", "Arrepentida", "Avergonzada", "Desconcertada", "Escandalizada", "Incómoda", "Inquieta", "Intranquila", "Preocupada", "Sobresaltada", "Sorprendida", "Temblorosa"]
  },
  {
    id: "interes",
    name: "Interés",
    subEmotions: ["Abierta", "Atenta", "Atraída", "Comprometida", "Curiosa", "Decidida", "Dispuesta", "Inspirada", "Interesada", "Intrigada", "Involucrada", "Motivada"]
  },
  {
    id: "irritacion",
    name: "Irritación",
    subEmotions: ["Consternada", "Frustrada", "Impaciente", "Irascible", "Irritada", "Malhumorada", "Molesta"]
  },
  {
    id: "miedo",
    name: "Miedo",
    subEmotions: ["Acongojada", "Asustada", "Atemorizada", "Aterrorizada", "Desconfiada", "Pánico", "Preocupada"]
  },
  {
    id: "paz",
    name: "Paz",
    subEmotions: ["Aliviada", "Sosegada", "Calmada", "Centrada", "Cercana", "Cómoda", "Contenta", "Desahogada", "Despreocupada", "Lúcida", "Plácida", "Realizada", "Relajada", "Satisfecha", "Serena", "Tranquila"]
  },
  {
    id: "tension",
    name: "Tensión",
    subEmotions: ["Ansiosa", "Conmocionada", "Desbordada", "Estresada", "Irritable", "Nerviosa", "Sobrecargada", "Sobrepasada", "Tensa"]
  },
  {
    id: "tristeza",
    name: "Tristeza",
    subEmotions: ["Decepcionada", "Deprimida", "Desanimada", "Desgraciada", "Desilusionada", "Infeliz", "Triste"]
  },
  {
    id: "vulnerabilidad",
    name: "Vulnerabilidad",
    subEmotions: ["Frágil", "Impotente", "Insegura", "Sensible", "Tímida", "Vulnerable"]
  }
];

export default function EmotionJournal() {
  const [selectedMainEmotions, setSelectedMainEmotions] = useState<string[]>([]);
  const [selectedSubEmotions, setSelectedSubEmotions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedEntries, setSavedEntries] = useState<SavedEmotionEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSavedEntries();
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

  const toggleMainEmotion = (emotionId: string) => {
    setSelectedMainEmotions(prev => {
      if (prev.includes(emotionId)) {
        // Remove main emotion and its sub-emotions
        const emotion = emotions.find(e => e.id === emotionId);
        const subEmotionsToRemove = emotion?.subEmotions || [];
        setSelectedSubEmotions(current => 
          current.filter(sub => !subEmotionsToRemove.includes(sub))
        );
        return prev.filter(id => id !== emotionId);
      } else {
        return [...prev, emotionId];
      }
    });
  };

  const toggleSubEmotion = (subEmotion: string) => {
    setSelectedSubEmotions(prev => 
      prev.includes(subEmotion)
        ? prev.filter(e => e !== subEmotion)
        : [...prev, subEmotion]
    );
  };

  const handleSubmit = async () => {
    if (selectedMainEmotions.length === 0 || selectedSubEmotions.length === 0) {
      toast({
        title: "Error",
        description: "Debes seleccionar al menos una emoción principal y una sub-emoción",
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
          description: "Debes iniciar sesión para guardar tus emociones",
          variant: "destructive"
        });
        return;
      }

      const mainEmotionNames = selectedMainEmotions
        .map(id => emotions.find(e => e.id === id)?.name)
        .filter(Boolean);
      
      console.log('Guardando:', {
        mainEmotions: selectedMainEmotions,
        mainEmotionNames,
        subEmotions: selectedSubEmotions
      });

      const { error } = await (supabase as any)
        .from('emotion_journal')
        .insert({
          user_id: user.id,
          main_emotion: mainEmotionNames.join(', '),
          sub_emotions: selectedSubEmotions,
          entry_date: new Date().toISOString().split('T')[0]
        });

      if (error) throw error;

      toast({
        title: "¡Guardado!",
        description: "Tus emociones han sido registradas exitosamente"
      });

      // Reset selections
      setSelectedMainEmotions([]);
      setSelectedSubEmotions([]);
      await loadSavedEntries();
    } catch (error) {
      console.error('Error saving emotions:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar tu entrada",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (entry: SavedEmotionEntry) => {
    setEditingEntry(entry.id);
    const mainEmotionNames = entry.main_emotion.split(', ');
    const mainEmotionIds = mainEmotionNames
      .map(name => emotions.find(e => e.name === name)?.id)
      .filter(Boolean) as string[];
    
    setSelectedMainEmotions(mainEmotionIds);
    setSelectedSubEmotions(entry.sub_emotions);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdate = async () => {
    if (!editingEntry) return;

    if (selectedMainEmotions.length === 0 || selectedSubEmotions.length === 0) {
      toast({
        title: "Error",
        description: "Debes seleccionar al menos una emoción principal y una sub-emoción",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const mainEmotionNames = selectedMainEmotions
        .map(id => emotions.find(e => e.id === id)?.name)
        .filter(Boolean);
      
      const { error } = await (supabase as any)
        .from('emotion_journal')
        .update({
          main_emotion: mainEmotionNames.join(', '),
          sub_emotions: selectedSubEmotions
        })
        .eq('id', editingEntry);

      if (error) throw error;

      toast({
        title: "¡Actualizado!",
        description: "Tu entrada ha sido actualizada exitosamente"
      });

      setEditingEntry(null);
      setSelectedMainEmotions([]);
      setSelectedSubEmotions([]);
      await loadSavedEntries();
    } catch (error) {
      console.error('Error updating entry:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar tu entrada",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('emotion_journal')
        .delete()
        .eq('id', entryId);

      if (error) throw error;

      toast({
        title: "Eliminado",
        description: "La entrada ha sido eliminada"
      });

      await loadSavedEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la entrada",
        variant: "destructive"
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setSelectedMainEmotions([]);
    setSelectedSubEmotions([]);
  };

  const selectedEmotionsData = emotions.filter(e => selectedMainEmotions.includes(e.id));

  return (
    <div className="py-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Diario de Emociones
          </h1>
          <p className="text-muted-foreground">
            ¿Cómo te sientes hoy? Selecciona las emociones que mejor describan tu estado
          </p>
        </div>
      </div>

      <Card className="p-8 bg-card border-border">
        <div className="space-y-8">
          {/* Main Emotions */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">Emociones Principales</h2>
            <div className="flex flex-wrap gap-3">
              {emotions.map((emotion) => {
                const isSelected = selectedMainEmotions.includes(emotion.id);
                return (
                  <Button
                    key={emotion.id}
                    variant={isSelected ? "accent" : "outline"}
                    size="lg"
                    onClick={() => toggleMainEmotion(emotion.id)}
                    className={`rounded-full px-6 h-12 text-base font-medium transition-all ${
                      isSelected 
                        ? "bg-green-600 hover:bg-green-700 text-white border-green-600" 
                        : "hover:bg-primary/10 hover:border-primary/50"
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        {emotion.name}
                      </>
                    ) : (
                      <>+ {emotion.name}</>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Sub Emotions */}
          {selectedMainEmotions.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">Emociones Específicas</h2>
              <div className="space-y-6">
                {selectedEmotionsData.map((emotion) => (
                  <div key={emotion.id}>
                    <h3 className="text-lg font-medium text-foreground/80 mb-3">{emotion.name}</h3>
                    <div className="flex flex-wrap gap-3">
                      {emotion.subEmotions.map((subEmotion) => {
                        const isSelected = selectedSubEmotions.includes(subEmotion);
                        return (
                          <Button
                            key={subEmotion}
                            variant={isSelected ? "accent" : "outline"}
                            size="lg"
                            onClick={() => toggleSubEmotion(subEmotion)}
                            className={`rounded-full px-6 h-12 text-base font-medium transition-all ${
                              isSelected 
                                ? "bg-green-600 hover:bg-green-700 text-white border-green-600" 
                                : "hover:bg-primary/10 hover:border-primary/50"
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                {subEmotion}
                              </>
                            ) : (
                              <>+ {subEmotion}</>
                            )}
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
      </Card>

      {/* Save/Update Button - Outside the card */}
      {selectedSubEmotions.length > 0 && (
        <div className="flex justify-center gap-4">
          {editingEntry && (
            <Button
              size="lg"
              variant="outline"
              onClick={handleCancelEdit}
              className="rounded-full px-8 h-14 text-lg font-semibold"
            >
              Cancelar
            </Button>
          )}
          <Button
            size="lg"
            onClick={editingEntry ? handleUpdate : handleSubmit}
            disabled={isSaving}
            className="rounded-full px-12 h-14 text-lg font-semibold bg-primary hover:bg-primary/90 shadow-lg"
          >
            {isSaving ? (editingEntry ? "Actualizando..." : "Guardando...") : (editingEntry ? "Actualizar" : "Guardar")}
          </Button>
        </div>
      )}

      {/* Emotion Log Widget */}
      {savedEntries.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Registro de Emociones</h2>
          <div className="space-y-4">
            {savedEntries.map((entry) => (
              <Card key={entry.id} className="p-6 bg-card border-border">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {format(new Date(entry.created_at), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                    </span>
                  </div>
                  <div className="flex gap-2">
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
                      onClick={() => handleDelete(entry.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground/70 mb-2">Emociones Principales</h3>
                    <div className="flex flex-wrap gap-2">
                      {entry.main_emotion.split(', ').map((emotion, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-full bg-green-600/20 text-green-600 text-sm font-medium"
                        >
                          {emotion}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-foreground/70 mb-2">Emociones Específicas</h3>
                    <div className="flex flex-wrap gap-2">
                      {entry.sub_emotions.map((emotion, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm"
                        >
                          {emotion}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
