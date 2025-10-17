import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Pencil, Trash2, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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

const emotionCategories: PrimaryCategory[] = [
  {
    id: "conectado",
    name: "Conectado",
    secondaryEmotions: [
      {
        id: "afectuoso",
        name: "Afectuoso",
        tertiaryEmotions: ["Compasivo", "Amigable", "Amoroso", "De corazón abierto", "Simpático", "Tierno", "Cálido"]
      },
      {
        id: "agradecido",
        name: "Agradecido",
        tertiaryEmotions: ["Humildad", "Asombro", "Alegría suave", "Calidez", "Generosidad", "Reconocimiento"]
      },
      {
        id: "comprometido",
        name: "Comprometido",
        tertiaryEmotions: ["Absorto", "Alerta", "Curioso", "Absorto", "Encantado", "Fascinado", "Interesado", "Intrigado", "Involucrado", "Estimulado"]
      },
      {
        id: "conectado",
        name: "Conectado",
        tertiaryEmotions: ["Empatía", "Complicidad", "Afiliación", "Sintonía", "Cuidado"]
      },
      {
        id: "confiado",
        name: "Confiado",
        tertiaryEmotions: ["Empoderado", "Abierto", "Orgulloso", "Seguro", "Protegido"]
      },
      {
        id: "abierto",
        name: "Abierto",
        tertiaryEmotions: ["Receptivo", "Disponible", "Accesible", "Transparente", "Sincero"]
      },
      {
        id: "seguro",
        name: "Seguro",
        tertiaryEmotions: ["Tranquilidad", "Confianza", "Calma", "Aceptación", "Pertenencia", "Previsibilidad", "Intimidad"]
      },
      {
        id: "pacifico",
        name: "Pacífico",
        tertiaryEmotions: ["Calmado", "Despejado", "Cómodo", "Centrado", "Contento", "Ecuánime", "Realizado", "Tranquilo", "Quieto", "Relajado", "Aliviado", "Satisfecho", "Sereno", "Confiado"]
      }
    ]
  },
  {
    id: "desconectado",
    name: "Desconectado",
    secondaryEmotions: [
      {
        id: "desconectado",
        name: "Desconectado",
        tertiaryEmotions: ["Alienado", "Distante", "Apático", "Aburrido", "Frío", "Desapegado", "Distraído", "Indiferente", "Adormecido", "Alejado", "Desinteresado", "Retraído"]
      },
      {
        id: "descansado",
        name: "Descansado",
        tertiaryEmotions: ["Revitalizado", "Renovado", "Descansado", "Restaurado", "Revivido"]
      }
    ]
  },
  {
    id: "energico",
    name: "Enérgico",
    secondaryEmotions: [
      {
        id: "alegre",
        name: "Alegre",
        tertiaryEmotions: ["Divertido", "Encantado", "Contento", "Feliz", "Jubiloso", "Complacido", "Alegre"]
      },
      {
        id: "entusiasmado",
        name: "Entusiasmado",
        tertiaryEmotions: ["Animado", "Ardiente", "Emocionado", "Asombrado", "Deslumbrado", "Ansioso", "Enérgico", "Entusiasta", "Vigorizado", "Animado", "Apasionado", "Sorprendido", "Vibrante"]
      },
      {
        id: "esperanzado",
        name: "Esperanzado",
        tertiaryEmotions: ["Expectante", "Alentado", "Optimista"]
      },
      {
        id: "inspirado",
        name: "Inspirado",
        tertiaryEmotions: ["Asombrado", "Maravillado", "Admirado"]
      },
      {
        id: "euforico",
        name: "Eufórico",
        tertiaryEmotions: ["Dichoso", "Extático", "Exaltado", "Embelesado", "Exuberante", "Radiante", "Arrebatado", "Emocionado", "Hechizado"]
      }
    ]
  },
  {
    id: "cerrado",
    name: "Cerrado",
    secondaryEmotions: [
      {
        id: "rechazo",
        name: "Rechazo",
        tertiaryEmotions: ["Animosidad", "Horrorizado", "Desprecio", "Disgustado", "Desagrado", "Odio", "Hostil", "Repulsado"]
      },
      {
        id: "triste",
        name: "Triste",
        tertiaryEmotions: ["Deprimido", "Abatido", "Desesperado", "Desalentado", "Decepcionado", "Desanimado", "Descorazonado", "Desolado", "Sombrío", "Sin esperanza", "Melancólico", "Infeliz", "Desdichado"]
      }
    ]
  },
  {
    id: "vulnerable",
    name: "Vulnerable",
    secondaryEmotions: [
      {
        id: "dolor",
        name: "Dolor",
        tertiaryEmotions: ["Agonía", "Angustiado", "Afligido", "Devastado", "Duelo", "Desconsolado", "Herido", "Solo", "Miserable", "Arrepentido", "Remordido"]
      },
      {
        id: "vulnerable",
        name: "Vulnerable",
        tertiaryEmotions: ["Frágil", "Indefenso", "Inseguro", "Cauteloso", "Reservado", "Sensible", "Tembloroso"]
      },
      {
        id: "avergonzado",
        name: "Avergonzado",
        tertiaryEmotions: ["Avergonzado", "Mortificado", "Turbado", "Culpable", "Cohibido"]
      }
    ]
  },
  {
    id: "reactivo",
    name: "Reactivo",
    secondaryEmotions: [
      {
        id: "enojado",
        name: "Enojado",
        tertiaryEmotions: ["Enfurecido", "Furioso", "Indignado", "Airado", "Iracundo", "Lívido", "Ultrajado", "Resentido"]
      },
      {
        id: "molesto",
        name: "Molesto",
        tertiaryEmotions: ["Agravado", "Consternado", "Disgustado", "Descontento", "Exasperado", "Frustrado", "Impaciente", "Irritado", "Molesto"]
      },
      {
        id: "inquieto",
        name: "Inquieto",
        tertiaryEmotions: ["Agitado", "Alarmado", "Desconcertado", "Perturbado", "Alterado", "Inquieto", "Conmocionado", "Sobresaltado", "Sorprendido", "Preocupado", "Turbulento", "Agitación"]
      },
      {
        id: "tenso",
        name: "Tenso",
        tertiaryEmotions: ["Ansioso", "Angustiado", "Consternado", "Nervioso", "Inquieto", "Estresado", "Irritable", "Abrumado", "Estresado"]
      }
    ]
  },
  {
    id: "confundido",
    name: "Confundido",
    secondaryEmotions: [
      {
        id: "confundido",
        name: "Confundido",
        tertiaryEmotions: ["Ambivalente", "Desconcertado", "Perplejo", "Aturdido", "Vacilante", "Perdido", "Desconcertado", "Confuso", "Dividido"]
      },
      {
        id: "asustado",
        name: "Asustado",
        tertiaryEmotions: ["Aprensivo", "Temor", "Presentimiento", "Atemorizado", "Desconfiado", "En pánico", "Petrificado", "Asustado", "Sospechoso", "Aterrorizado", "Cauteloso", "Preocupado"]
      },
      {
        id: "incomodo",
        name: "Incómodo",
        tertiaryEmotions: ["Incómodo", "Intranquilo", "Nervioso", "Inquieto", "Molesto"]
      },
      {
        id: "fatigado",
        name: "Fatigado",
        tertiaryEmotions: ["Agotado", "Quemado", "Agotado", "Exhausto", "Letárgico", "Apático", "Somnoliento", "Cansado", "Fatigado"]
      }
    ]
  }
];

export default function EmotionJournal() {
  const [selectedPrimary, setSelectedPrimary] = useState<string | null>(null);
  const [selectedSecondary, setSelectedSecondary] = useState<string[]>([]);
  const [selectedTertiary, setSelectedTertiary] = useState<string[]>([]);
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

  const togglePrimary = (categoryId: string) => {
    if (selectedPrimary === categoryId) {
      // Deselect and clear all selections
      setSelectedPrimary(null);
      setSelectedSecondary([]);
      setSelectedTertiary([]);
    } else {
      // Select new primary and clear secondary/tertiary
      setSelectedPrimary(categoryId);
      setSelectedSecondary([]);
      setSelectedTertiary([]);
    }
  };

  const toggleSecondary = (emotionId: string) => {
    setSelectedSecondary(prev => {
      if (prev.includes(emotionId)) {
        // Remove secondary emotion and its tertiary emotions
        const category = emotionCategories.find(c => c.id === selectedPrimary);
        const emotion = category?.secondaryEmotions.find(e => e.id === emotionId);
        const tertiaryToRemove = emotion?.tertiaryEmotions || [];
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
    if (!selectedPrimary) {
      toast({
        title: "Error",
        description: "Debes seleccionar una categoría principal",
        variant: "destructive"
      });
      return;
    }

    if (selectedSecondary.length === 0) {
      toast({
        title: "Error",
        description: "Debes seleccionar al menos una emoción secundaria",
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

      const primaryCategory = emotionCategories.find(c => c.id === selectedPrimary);
      const secondaryNames = selectedSecondary
        .map(id => {
          const emotion = primaryCategory?.secondaryEmotions.find(e => e.id === id);
          return emotion?.name;
        })
        .filter(Boolean) as string[];

      const { error } = await (supabase as any)
        .from('emotion_journal')
        .insert({
          user_id: user.id,
          primary_emotion: primaryCategory?.name,
          secondary_emotions: secondaryNames,
          tertiary_emotions: selectedTertiary,
          entry_date: new Date().toISOString().split('T')[0]
        });

      if (error) throw error;

      toast({
        title: "¡Guardado!",
        description: "Tus emociones han sido registradas exitosamente"
      });

      setSelectedPrimary(null);
      setSelectedSecondary([]);
      setSelectedTertiary([]);
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
    
    // Find primary category
    const primaryCategory = emotionCategories.find(c => c.name === entry.primary_emotion);
    if (primaryCategory) {
      setSelectedPrimary(primaryCategory.id);
      
      // Map secondary emotion names to IDs
      const secondaryIds = entry.secondary_emotions
        .map(name => {
          const emotion = primaryCategory.secondaryEmotions.find(e => e.name === name);
          return emotion?.id;
        })
        .filter(Boolean) as string[];
      
      setSelectedSecondary(secondaryIds);
      setSelectedTertiary(entry.tertiary_emotions);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdate = async () => {
    if (!editingEntry) return;

    if (!selectedPrimary || selectedSecondary.length === 0) {
      toast({
        title: "Error",
        description: "Debes seleccionar una categoría principal y al menos una emoción secundaria",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const primaryCategory = emotionCategories.find(c => c.id === selectedPrimary);
      const secondaryNames = selectedSecondary
        .map(id => {
          const emotion = primaryCategory?.secondaryEmotions.find(e => e.id === id);
          return emotion?.name;
        })
        .filter(Boolean) as string[];
      
      const { error } = await (supabase as any)
        .from('emotion_journal')
        .update({
          primary_emotion: primaryCategory?.name,
          secondary_emotions: secondaryNames,
          tertiary_emotions: selectedTertiary
        })
        .eq('id', editingEntry);

      if (error) throw error;

      toast({
        title: "¡Actualizado!",
        description: "Tu entrada ha sido actualizada exitosamente"
      });

      setEditingEntry(null);
      setSelectedPrimary(null);
      setSelectedSecondary([]);
      setSelectedTertiary([]);
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
    setSelectedPrimary(null);
    setSelectedSecondary([]);
    setSelectedTertiary([]);
  };

  // Get selected category data
  const selectedCategory = emotionCategories.find(c => c.id === selectedPrimary);
  
  // Get selected secondary emotions data (reversed for last-selected-first display)
  const selectedSecondaryData = selectedCategory?.secondaryEmotions
    .filter(e => selectedSecondary.includes(e.id))
    .sort((a, b) => {
      const indexA = selectedSecondary.indexOf(a.id);
      const indexB = selectedSecondary.indexOf(b.id);
      return indexB - indexA;
    }) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="p-8 bg-card border-border">
        <div className="space-y-8">
          {/* Primary Categories */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">¿Cómo te sientes aquí y ahora?</h2>
            <div className="flex flex-wrap gap-3">
              {emotionCategories.map((category) => {
                const isSelected = selectedPrimary === category.id;
                return (
                  <Button
                    key={category.id}
                    variant={isSelected ? "accent" : "outline"}
                    size="lg"
                    onClick={() => togglePrimary(category.id)}
                    className={`rounded-full px-6 h-12 text-base font-medium transition-all ${
                      isSelected 
                        ? "bg-green-600 hover:bg-green-700 text-white border-green-600" 
                        : "hover:bg-primary/10 hover:border-primary/50"
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        {category.name}
                      </>
                    ) : (
                      <>+ {category.name}</>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Secondary Emotions */}
          {selectedPrimary && selectedCategory && (
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">Emociones primarias:</h2>
              <div className="flex flex-wrap gap-3">
                {selectedCategory.secondaryEmotions.map((emotion) => {
                  const isSelected = selectedSecondary.includes(emotion.id);
                  return (
                    <Button
                      key={emotion.id}
                      variant={isSelected ? "accent" : "outline"}
                      size="lg"
                      onClick={() => toggleSecondary(emotion.id)}
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
          )}

          {/* Tertiary Emotions */}
          {selectedSecondary.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">Emociones secundarias:</h2>
              <div className="space-y-6">
                {selectedSecondaryData.map((emotion) => (
                  <div key={emotion.id}>
                    <h3 className="text-lg font-medium text-foreground/80 mb-3">{emotion.name}</h3>
                    <div className="flex flex-wrap gap-3">
                      {emotion.tertiaryEmotions.map((tertiaryEmotion) => {
                        const isSelected = selectedTertiary.includes(tertiaryEmotion);
                        return (
                          <Button
                            key={tertiaryEmotion}
                            variant={isSelected ? "accent" : "outline"}
                            size="lg"
                            onClick={() => toggleTertiary(tertiaryEmotion)}
                            className={`rounded-full px-6 h-12 text-base font-medium transition-all ${
                              isSelected 
                                ? "bg-green-600 hover:bg-green-700 text-white border-green-600" 
                                : "hover:bg-primary/10 hover:border-primary/50"
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                {tertiaryEmotion}
                              </>
                            ) : (
                              <>+ {tertiaryEmotion}</>
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

        {/* Save/Update Button */}
        {selectedPrimary && selectedSecondary.length > 0 && (
          <div className="flex justify-end gap-4 mt-6">
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
      </Card>

      {/* Emotion Log Widget */}
      {savedEntries.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Registro de emociones:</h2>
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
                  {entry.primary_emotion && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Categoría:</h3>
                      <span className="px-3 py-1 rounded-full bg-green-600/20 text-green-600 text-sm font-medium">
                        {entry.primary_emotion}
                      </span>
                    </div>
                  )}

                  {entry.secondary_emotions && entry.secondary_emotions.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Primarias:</h3>
                      <div className="flex flex-wrap gap-2">
                        {entry.secondary_emotions.map((emotion, idx) => (
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
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Secundarias:</h3>
                      <div className="flex flex-wrap gap-2">
                        {[...entry.tertiary_emotions].reverse().map((emotion, idx) => (
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
