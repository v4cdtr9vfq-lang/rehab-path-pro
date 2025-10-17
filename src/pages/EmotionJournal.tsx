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
    id: "cerrado",
    name: "Cerrado",
    secondaryEmotions: [
      {
        id: "rechazo",
        name: "Rechazo",
        tertiaryEmotions: ["Animosidad", "Desprecio", "Desagrado", "Disgustado", "Horrorizado", "Hostil", "Odio", "Repulsado"]
      },
      {
        id: "triste",
        name: "Triste",
        tertiaryEmotions: ["Abatido", "Decepcionado", "Deprimido", "Desalentado", "Desanimado", "Descorazonado", "Desdichado", "Desesperado", "Desolado", "Infeliz", "Melancólico", "Sin esperanza", "Sombrío"]
      }
    ]
  },
  {
    id: "confundido",
    name: "Confundido",
    secondaryEmotions: [
      {
        id: "asustado",
        name: "Asustado",
        tertiaryEmotions: ["Aprensivo", "Asustado", "Atemorizado", "Aterrorizado", "Cauteloso", "Desconfiado", "En pánico", "Petrificado", "Preocupado", "Presentimiento", "Sospechoso", "Temor"]
      },
      {
        id: "confundido",
        name: "Confundido",
        tertiaryEmotions: ["Ambivalente", "Aturdido", "Confuso", "Desconcertado", "Dividido", "Perdido", "Perplejo", "Vacilante"]
      },
      {
        id: "fatigado",
        name: "Fatigado",
        tertiaryEmotions: ["Agotado", "Apático", "Cansado", "Exhausto", "Fatigado", "Letárgico", "Quemado", "Somnoliento"]
      },
      {
        id: "incomodo",
        name: "Incómodo",
        tertiaryEmotions: ["Incómodo", "Inquieto", "Intranquilo", "Molesto", "Nervioso"]
      }
    ]
  },
  {
    id: "conectado",
    name: "Conectado",
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
        id: "conectado",
        name: "Conectado",
        tertiaryEmotions: ["Afiliación", "Complicidad", "Cuidado", "Empatía", "Sintonía"]
      },
      {
        id: "confiado",
        name: "Confiado",
        tertiaryEmotions: ["Abierto", "Empoderado", "Orgulloso", "Protegido", "Seguro"]
      },
      {
        id: "pacifico",
        name: "Pacífico",
        tertiaryEmotions: ["Aliviado", "Calmado", "Centrado", "Cómodo", "Confiado", "Contento", "Despejado", "Ecuánime", "Quieto", "Realizado", "Relajado", "Satisfecho", "Sereno", "Tranquilo"]
      },
      {
        id: "seguro",
        name: "Seguro",
        tertiaryEmotions: ["Aceptación", "Calma", "Confianza", "Intimidad", "Pertenencia", "Previsibilidad", "Tranquilidad"]
      }
    ]
  },
  {
    id: "desconectado",
    name: "Desconectado",
    secondaryEmotions: [
      {
        id: "descansado",
        name: "Descansado",
        tertiaryEmotions: ["Descansado", "Renovado", "Restaurado", "Revitalizado", "Revivido"]
      },
      {
        id: "desconectado",
        name: "Desconectado",
        tertiaryEmotions: ["Aburrido", "Adormecido", "Alejado", "Alienado", "Apático", "Desapegado", "Desinteresado", "Distante", "Distraído", "Frío", "Indiferente", "Retraído"]
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
        tertiaryEmotions: ["Alegre", "Complacido", "Contento", "Divertido", "Encantado", "Feliz", "Jubiloso"]
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
        tertiaryEmotions: ["Airado", "Enfurecido", "Furioso", "Indignado", "Iracundo", "Lívido", "Resentido", "Ultrajado"]
      },
      {
        id: "inquieto",
        name: "Inquieto",
        tertiaryEmotions: ["Agitación", "Agitado", "Alarmado", "Alterado", "Conmocionado", "Desconcertado", "Inquieto", "Perturbado", "Preocupado", "Sobresaltado", "Sorprendido", "Turbulento"]
      },
      {
        id: "molesto",
        name: "Molesto",
        tertiaryEmotions: ["Agravado", "Consternado", "Descontento", "Disgustado", "Exasperado", "Frustrado", "Impaciente", "Irritado", "Molesto"]
      },
      {
        id: "tenso",
        name: "Tenso",
        tertiaryEmotions: ["Abrumado", "Angustiado", "Ansioso", "Consternado", "Estresado", "Inquieto", "Irritable", "Nervioso"]
      }
    ]
  },
  {
    id: "vulnerable",
    name: "Vulnerable",
    secondaryEmotions: [
      {
        id: "avergonzado",
        name: "Avergonzado",
        tertiaryEmotions: ["Avergonzado", "Cohibido", "Culpable", "Mortificado", "Turbado"]
      },
      {
        id: "dolor",
        name: "Dolor",
        tertiaryEmotions: ["Afligido", "Agonía", "Angustiado", "Arrepentido", "Desconsolado", "Devastado", "Duelo", "Herido", "Miserable", "Remordido", "Solo"]
      },
      {
        id: "vulnerable",
        name: "Vulnerable",
        tertiaryEmotions: ["Cauteloso", "Frágil", "Indefenso", "Inseguro", "Reservado", "Sensible", "Tembloroso"]
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
  
  // Get selected secondary emotions data (sorted alphabetically)
  const selectedSecondaryData = selectedCategory?.secondaryEmotions
    .filter(e => selectedSecondary.includes(e.id))
    .sort((a, b) => a.name.localeCompare(b.name)) || [];

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
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Secundarias:</h3>
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
