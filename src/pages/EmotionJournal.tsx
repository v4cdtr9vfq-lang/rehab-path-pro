import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, Check } from "lucide-react";

interface Emotion {
  id: string;
  name: string;
  subEmotions: string[];
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
  const [selectedMainEmotion, setSelectedMainEmotion] = useState<string | null>(null);
  const [selectedSubEmotions, setSelectedSubEmotions] = useState<string[]>([]);

  const handleMainEmotionClick = (emotionId: string) => {
    setSelectedMainEmotion(emotionId);
    setSelectedSubEmotions([]);
  };

  const handleBackClick = () => {
    setSelectedMainEmotion(null);
    setSelectedSubEmotions([]);
  };

  const toggleSubEmotion = (subEmotion: string) => {
    setSelectedSubEmotions(prev => 
      prev.includes(subEmotion)
        ? prev.filter(e => e !== subEmotion)
        : [...prev, subEmotion]
    );
  };

  const currentEmotion = emotions.find(e => e.id === selectedMainEmotion);

  return (
    <div className="py-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Diario de Emociones
          </h1>
          <p className="text-muted-foreground">
            {selectedMainEmotion 
              ? "Selecciona las emociones específicas que sientes" 
              : "¿Cómo te sientes hoy? Selecciona una emoción principal"}
          </p>
        </div>
      </div>

      <Card className="p-8 bg-card border-border">
        {!selectedMainEmotion ? (
          <div className="flex flex-wrap gap-3">
            {emotions.map((emotion) => (
              <Button
                key={emotion.id}
                variant="outline"
                size="lg"
                onClick={() => handleMainEmotionClick(emotion.id)}
                className="rounded-full px-6 h-12 text-base font-medium hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
              >
                + {emotion.name}
              </Button>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackClick}
                className="h-10 w-10 rounded-full"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-2xl font-bold text-foreground">
                {currentEmotion?.name}
              </h2>
            </div>

            <div className="flex flex-wrap gap-3">
              {currentEmotion?.subEmotions.map((subEmotion) => {
                const isSelected = selectedSubEmotions.includes(subEmotion);
                return (
                  <Button
                    key={subEmotion}
                    variant={isSelected ? "accent" : "outline"}
                    size="lg"
                    onClick={() => toggleSubEmotion(subEmotion)}
                    className={`rounded-full px-6 h-12 text-base font-medium transition-all ${
                      isSelected 
                        ? "bg-primary text-primary-foreground border-primary" 
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

            {selectedSubEmotions.length > 0 && (
              <div className="pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground mb-3">
                  Has seleccionado {selectedSubEmotions.length} emoción(es):
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedSubEmotions.map((emotion) => (
                    <span
                      key={emotion}
                      className="px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium"
                    >
                      {emotion}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
