import { TFunction } from 'i18next';

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

export const getEmotionCategories = (t: TFunction): PrimaryCategory[] => {
  const lang = t('common.yes') === 'Yes' ? 'en' : 'es';
  
  if (lang === 'en') {
    return [
      {
        id: "confundido",
        name: "Confusion",
        secondaryEmotions: [
          {
            id: "desorientado",
            name: "Disoriented",
            tertiaryEmotions: ["Dazed", "Lost"].sort()
          }
        ].sort((a, b) => a.name.localeCompare(b.name))
      },
      {
        id: "asco",
        name: "Disgust",
        secondaryEmotions: [
          {
            id: "repugnancia",
            name: "Repugnance",
            tertiaryEmotions: ["Denial", "Nausea", "Repulsion"].sort()
          }
        ].sort((a, b) => a.name.localeCompare(b.name))
      },
      {
        id: "miedo",
        name: "Fear",
        secondaryEmotions: [
          {
            id: "asustado",
            name: "Scared",
            tertiaryEmotions: ["Apprehensive", "Cautious", "Distrustful", "Dread", "Foreboding", "Frightened", "Panicked", "Petrified", "Suspicious", "Terrified", "Worried"].sort()
          },
          {
            id: "tenso",
            name: "Tense",
            tertiaryEmotions: ["Dismayed", "Irritable", "Nervous", "Overwhelmed", "Stressed"].sort()
          }
        ].sort((a, b) => a.name.localeCompare(b.name))
      },
      {
        id: "vulnerable",
        name: "Insecurity",
        secondaryEmotions: [
          {
            id: "avergonzado",
            name: "Ashamed",
            tertiaryEmotions: ["Embarrassed", "Guilty", "Mortified", "Self-conscious"].sort()
          },
          {
            id: "impaciente",
            name: "Impatient",
            tertiaryEmotions: ["Desperate", "Expectant", "Intolerant", "Overwhelmed"].sort()
          },
          {
            id: "inquieto",
            name: "Restless",
            tertiaryEmotions: ["Agitated", "Alarmed", "Disconcerted", "Disturbed", "Startled", "Turbulent", "Upset"].sort()
          },
          {
            id: "incomodo",
            name: "Uncomfortable",
            tertiaryEmotions: ["Uneasy"].sort()
          },
          {
            id: "vulnerable",
            name: "Vulnerable",
            tertiaryEmotions: ["Fragile", "Helpless", "Reserved", "Sensitive", "Trembling"].sort()
          }
        ].sort((a, b) => a.name.localeCompare(b.name))
      },
      {
        id: "irritado",
        name: "Irritation",
        secondaryEmotions: [
          {
            id: "enojado",
            name: "Angry",
            tertiaryEmotions: ["Enraged", "Furious", "Indignant", "Outraged", "Resentful", "Wrathful"].sort()
          },
          {
            id: "molesto",
            name: "Annoyed",
            tertiaryEmotions: ["Disgusted", "Exasperated"].sort()
          },
          {
            id: "deseo",
            name: "Desirous",
            tertiaryEmotions: ["Craving", "Greed", "Greedy", "Hungry", "Longing", "Obsession"].sort()
          },
          {
            id: "frustracion",
            name: "Frustrated",
            tertiaryEmotions: ["Powerless"].sort()
          }
        ].sort((a, b) => a.name.localeCompare(b.name))
      },
      {
        id: "alegre",
        name: "Joy",
        secondaryEmotions: [
          {
            id: "euforico",
            name: "Euphoric",
            tertiaryEmotions: ["Bewitched", "Blissful", "Ecstatic", "Enchanted", "Enraptured", "Exalted", "Exuberant", "Radiant"].sort()
          },
          {
            id: "entusiasmado",
            name: "Excited",
            tertiaryEmotions: ["Amazed", "Animated", "Dazzled", "Energetic", "Enthusiastic", "Fiery", "Invigorated", "Passionate", "Surprised", "Vibrant"].sort()
          },
          {
            id: "pleno",
            name: "Fulfilled",
            tertiaryEmotions: ["Gratitude", "Peace", "Satisfaction", "Transcendence"].sort()
          },
          {
            id: "esperanzado",
            name: "Hopeful",
            tertiaryEmotions: ["Encouraged", "Optimistic"].sort()
          },
          {
            id: "inspirado",
            name: "Inspired",
            tertiaryEmotions: []
          },
          {
            id: "descansado",
            name: "Rested",
            tertiaryEmotions: ["Renewed", "Restored", "Revitalized", "Revived"].sort()
          }
        ].sort((a, b) => a.name.localeCompare(b.name))
      },
      {
        id: "triste",
        name: "Sadness",
        secondaryEmotions: [
          {
            id: "deprimido",
            name: "Depressed",
            tertiaryEmotions: ["Dejected", "Despondent", "Discouraged", "Hopeless", "Worthless"].sort()
          },
          {
            id: "decepcionado",
            name: "Disappointed",
            tertiaryEmotions: ["Betrayed", "Disheartened", "Disillusioned", "Frustrated", "Let down"].sort()
          },
          {
            id: "desanimado",
            name: "Discouraged",
            tertiaryEmotions: ["Defeated", "Demoralized"].sort()
          },
          {
            id: "solo",
            name: "Lonely",
            tertiaryEmotions: ["Isolated", "Neglected", "Unwanted"].sort()
          }
        ].sort((a, b) => a.name.localeCompare(b.name))
      },
      {
        id: "conectado",
        name: "Security",
        secondaryEmotions: [
          {
            id: "afectuoso",
            name: "Affectionate",
            tertiaryEmotions: ["Compassionate", "Friendly", "Generous", "Loving", "Sympathetic", "Tender", "Warm"].sort()
          },
          {
            id: "afirmacion",
            name: "Affirmation",
            tertiaryEmotions: ["Certainty", "Conviction", "Firmness", "Resolution"].sort()
          },
          {
            id: "seguro",
            name: "Connected",
            tertiaryEmotions: ["Acceptance", "Belonging", "Happy", "Intimacy", "Predictability", "Trust"].sort()
          },
          {
            id: "empoderado",
            name: "Empowered",
            tertiaryEmotions: ["Autonomous", "Capable", "Confident", "Strong", "Valuable"].sort()
          },
          {
            id: "comprometido",
            name: "Engaged",
            tertiaryEmotions: ["Absorbed", "Alert", "Curious", "Interested", "Intrigued", "Involved", "Stimulated"].sort()
          },
          {
            id: "agradecido",
            name: "Grateful",
            tertiaryEmotions: ["Amazement", "Recognition"].sort()
          },
          {
            id: "esperanzado_conectado",
            name: "Hopeful",
            tertiaryEmotions: ["Encouraged", "Optimistic"].sort()
          },
          {
            id: "abierto",
            name: "Open",
            tertiaryEmotions: ["Accessible", "Available", "Receptive", "Sincere", "Transparent"].sort()
          },
          {
            id: "satisfecho",
            name: "Satisfied",
            tertiaryEmotions: ["Accomplished", "Content", "Fulfilled", "Relieved"].sort()
          }
        ].sort((a, b) => a.name.localeCompare(b.name))
      },
      {
        id: "bad",
        name: "Discomfort",
        secondaryEmotions: [
          {
            id: "cansado",
            name: "Tired",
            tertiaryEmotions: ["Exhausted", "Fatigued"].sort()
          },
          {
            id: "estresado",
            name: "Stressed",
            tertiaryEmotions: ["Overwhelmed"].sort()
          },
          {
            id: "aburrido",
            name: "Bored",
            tertiaryEmotions: ["Apathetic", "Indifferent"].sort()
          }
        ].sort((a, b) => a.name.localeCompare(b.name))
      },
      {
        id: "peaceful",
        name: "Peaceful",
        secondaryEmotions: [
          {
            id: "calm",
            name: "Calm",
            tertiaryEmotions: ["Composed", "Balanced", "Steady", "Stable"].sort()
          },
          {
            id: "clearHeaded",
            name: "Clear Headed",
            tertiaryEmotions: ["Grounded", "Poised", "Collected", "Lucid", "Focused"].sort()
          },
          {
            id: "comfortable",
            name: "Comfortable",
            tertiaryEmotions: ["At Ease", "Cozy", "Safe", "Secure"].sort()
          },
          {
            id: "centered",
            name: "Centered",
            tertiaryEmotions: ["Anchored", "Aligned", "Harmonious"].sort()
          },
          {
            id: "content",
            name: "Content",
            tertiaryEmotions: ["Pleased", "Gratified", "Balanced", "Neutral"].sort()
          },
          {
            id: "equanimous",
            name: "Equanimous",
            tertiaryEmotions: ["Even-tempered", "Unruffled"].sort()
          },
          {
            id: "fulfilled",
            name: "Fulfilled",
            tertiaryEmotions: ["Complete", "Whole", "Accomplished"].sort()
          },
          {
            id: "mellow",
            name: "Mellow",
            tertiaryEmotions: ["Soft", "Gentle", "Easygoing"].sort()
          },
          {
            id: "quiet",
            name: "Quiet",
            tertiaryEmotions: ["Hushed", "Peaceful", "Undisturbed"].sort()
          },
          {
            id: "relaxed",
            name: "Relaxed",
            tertiaryEmotions: ["Unwound", "Loosened", "Calm"].sort()
          },
          {
            id: "relieved",
            name: "Relieved",
            tertiaryEmotions: ["Unburdened", "Soothed", "Comforted", "Appeased"].sort()
          },
          {
            id: "satisfied",
            name: "Satisfied",
            tertiaryEmotions: ["Contented", "Pleased", "Gratified"].sort()
          },
          {
            id: "serene",
            name: "Serene",
            tertiaryEmotions: ["Tranquil", "Untroubled", "Placid", "Smooth"].sort()
          },
          {
            id: "still",
            name: "Still",
            tertiaryEmotions: ["Motionless", "Settled", "Restful"].sort()
          },
          {
            id: "tranquil",
            name: "Tranquil",
            tertiaryEmotions: ["Soothing", "Undisturbed", "Peaceful"].sort()
          },
          {
            id: "trusting",
            name: "Trusting",
            tertiaryEmotions: ["Confident", "Assured", "Faithful"].sort()
          }
        ].sort((a, b) => a.name.localeCompare(b.name))
      }
    ].sort((a, b) => a.name.localeCompare(b.name));
  }
  
  // Spanish (default)
  return [
    {
      id: "alegre",
      name: "Alegría",
      secondaryEmotions: [
        {
          id: "descansado",
          name: "Descansado",
          tertiaryEmotions: ["Renovado", "Restaurado", "Revitalizado", "Revivido"].sort()
        },
        {
          id: "entusiasmado",
          name: "Entusiasmado",
          tertiaryEmotions: ["Animado", "Apasionado", "Ardiente", "Asombrado", "Deslumbrado", "Enérgico", "Entusiasta", "Sorprendido", "Vibrante", "Vigorizado"].sort()
        },
        {
          id: "esperanzado",
          name: "Esperanzado",
          tertiaryEmotions: ["Alentado", "Optimista"].sort()
        },
        {
          id: "euforico",
          name: "Eufórico",
          tertiaryEmotions: ["Arrebatado", "Dichoso", "Embelesado", "Exaltado", "Extático", "Exuberante", "Hechizado", "Radiante"].sort()
        },
        {
          id: "inspirado",
          name: "Inspirado",
          tertiaryEmotions: []
        },
        {
          id: "pleno",
          name: "Pleno",
          tertiaryEmotions: ["Gratitud", "Paz", "Satisfacción", "Trascendencia"].sort()
        }
      ].sort((a, b) => a.name.localeCompare(b.name, 'es'))
    },
    {
      id: "asco",
      name: "Asco",
      secondaryEmotions: [
        {
          id: "repugnancia",
          name: "Repugnancia",
          tertiaryEmotions: ["Náusea", "Negación", "Repulsión"].sort()
        }
      ].sort((a, b) => a.name.localeCompare(b.name, 'es'))
    },
    {
      id: "confundido",
      name: "Confusión",
      secondaryEmotions: [
        {
          id: "desorientado",
          name: "Desorientado",
          tertiaryEmotions: ["Aturdido", "Perdido"].sort()
        }
      ].sort((a, b) => a.name.localeCompare(b.name, 'es'))
    },
    {
      id: "vulnerable",
      name: "Inseguridad",
      secondaryEmotions: [
        {
          id: "avergonzado",
          name: "Avergonzado",
          tertiaryEmotions: ["Cohibido", "Culpable", "Mortificado", "Turbado"].sort()
        },
        {
          id: "impaciente",
          name: "Impaciente",
          tertiaryEmotions: ["Agobiado", "Desesperado", "Expectante", "Intolerante"].sort()
        },
        {
          id: "incomodo",
          name: "Incómodo",
          tertiaryEmotions: ["Intranquilo"].sort()
        },
        {
          id: "inquieto",
          name: "Inquieto",
          tertiaryEmotions: ["Agitado", "Alarmado", "Alterado", "Desconcertado", "Perturbado", "Sobresaltado", "Turbulento"].sort()
        },
        {
          id: "vulnerable",
          name: "Vulnerable",
          tertiaryEmotions: ["Frágil", "Indefenso", "Reservado", "Sensible", "Tembloroso"].sort()
        }
      ].sort((a, b) => a.name.localeCompare(b.name, 'es'))
    },
    {
      id: "irritado",
      name: "Irritación",
      secondaryEmotions: [
        {
          id: "deseo",
          name: "Deseoso",
          tertiaryEmotions: ["Anhelo", "Ansia", "Codicia", "Codicioso", "Hambriento", "Obsesión"].sort()
        },
        {
          id: "enojado",
          name: "Enojado",
          tertiaryEmotions: ["Enfurecido", "Furioso", "Indignado", "Iracundo", "Resentido", "Ultrajado"].sort()
        },
        {
          id: "frustracion",
          name: "Frustrado",
          tertiaryEmotions: ["Impotente"].sort()
        },
        {
          id: "molesto",
          name: "Molesto",
          tertiaryEmotions: ["Disgustado", "Exasperado"].sort()
        }
      ].sort((a, b) => a.name.localeCompare(b.name, 'es'))
    },
    {
      id: "miedo",
      name: "Miedo",
      secondaryEmotions: [
        {
          id: "asustado",
          name: "Asustado",
          tertiaryEmotions: ["Aprensivo", "Atemorizado", "Aterrorizado", "Cauteloso", "Desconfiado", "Despavorido", "Petrificado", "Preocupado", "Presentimiento", "Sospechoso", "Temor"].sort()
        },
        {
          id: "tenso",
          name: "Tenso",
          tertiaryEmotions: ["Abrumado", "Consternado", "Estresado", "Irritable", "Nervioso"].sort()
        }
      ].sort((a, b) => a.name.localeCompare(b.name, 'es'))
    },
    {
      id: "conectado",
      name: "Seguridad",
      secondaryEmotions: [
        {
          id: "abierto",
          name: "Abierto",
          tertiaryEmotions: ["Accesible", "Disponible", "Receptivo", "Sincero", "Transparente"].sort()
        },
        {
          id: "afectuoso",
          name: "Afectuoso",
          tertiaryEmotions: ["Amigable", "Amoroso", "Cálido", "Compasivo", "Generoso", "Simpático", "Tierno"].sort()
        },
        {
          id: "afirmacion",
          name: "Afirmación",
          tertiaryEmotions: ["Certeza", "Convicción", "Firmeza", "Resolución"].sort()
        },
        {
          id: "agradecido",
          name: "Agradecido",
          tertiaryEmotions: ["Asombro", "Reconocimiento"].sort()
        },
        {
          id: "comprometido",
          name: "Comprometido",
          tertiaryEmotions: ["Absorto", "Alerta", "Curioso", "Estimulado", "Interesado", "Intrigado", "Involucrado"].sort()
        },
        {
          id: "seguro",
          name: "Conectado",
          tertiaryEmotions: ["Aceptación", "Confianza", "Feliz", "Intimidad", "Pertenencia", "Previsibilidad"].sort()
        },
        {
          id: "empoderado",
          name: "Empoderado",
          tertiaryEmotions: ["Autónomo", "Capaz", "Confiado", "Fuerte", "Valioso"].sort()
        },
        {
          id: "esperanzado_conectado",
          name: "Esperanzado",
          tertiaryEmotions: ["Alentado", "Optimista"].sort()
        },
        {
          id: "satisfecho",
          name: "Satisfecho",
          tertiaryEmotions: ["Aliviado", "Complacido", "Contento", "Realizado"].sort()
        }
      ].sort((a, b) => a.name.localeCompare(b.name, 'es'))
    },
    {
      id: "triste",
      name: "Tristeza",
      secondaryEmotions: [
        {
          id: "decepcionado",
          name: "Decepcionado",
          tertiaryEmotions: ["Defraudado", "Desilusionado", "Descorazonado", "Frustrado", "Traicionado"].sort()
        },
        {
          id: "deprimido",
          name: "Deprimido",
          tertiaryEmotions: ["Abatido", "Desalentado", "Desanimado", "Desesperanzado", "Sin valor"].sort()
        },
        {
          id: "desanimado",
          name: "Desanimado",
          tertiaryEmotions: ["Derrotado", "Desmoralizado"].sort()
        },
        {
          id: "solo",
          name: "Solo",
          tertiaryEmotions: ["Aislado", "Descuidado", "No deseado"].sort()
        }
      ].sort((a, b) => a.name.localeCompare(b.name, 'es'))
    },
    {
      id: "bad",
      name: "Malestar",
      secondaryEmotions: [
        {
          id: "aburrido",
          name: "Aburrido",
          tertiaryEmotions: ["Apático", "Indiferente"].sort()
        },
        {
          id: "cansado",
          name: "Cansado",
          tertiaryEmotions: ["Exhausto", "Fatigado"].sort()
        },
        {
          id: "estresado",
          name: "Estresado",
          tertiaryEmotions: ["Abrumado"].sort()
        }
      ].sort((a, b) => a.name.localeCompare(b.name, 'es'))
    },
    {
      id: "peaceful",
      name: "Paz",
      secondaryEmotions: [
        {
          id: "calm",
          name: "Tranquilo",
          tertiaryEmotions: ["Compuesto", "Equilibrado", "Estable"].sort()
        },
        {
          id: "clearHeaded",
          name: "Mente Clara",
          tertiaryEmotions: ["Con los pies en la tierra", "Sereno", "Calmado", "Lúcido", "Enfocado"].sort()
        },
        {
          id: "comfortable",
          name: "Cómodo",
          tertiaryEmotions: ["A gusto", "Acogedor", "Seguro"].sort()
        },
        {
          id: "centered",
          name: "Centrado",
          tertiaryEmotions: ["Anclado", "Alineado", "Armonioso"].sort()
        },
        {
          id: "content",
          name: "Conforme",
          tertiaryEmotions: ["Complacido", "Gratificado", "Equilibrado", "Neutral"].sort()
        },
        {
          id: "equanimous",
          name: "Ecuánime",
          tertiaryEmotions: ["Templado", "Imperturbable"].sort()
        },
        {
          id: "fulfilled",
          name: "Realizado",
          tertiaryEmotions: ["Completo", "Entero", "Logrado"].sort()
        },
        {
          id: "mellow",
          name: "Apacible",
          tertiaryEmotions: ["Suave", "Gentil", "Tranquilo"].sort()
        },
        {
          id: "quiet",
          name: "Quieto",
          tertiaryEmotions: ["Silencioso", "Pacífico", "Imperturbado"].sort()
        },
        {
          id: "relaxed",
          name: "Relajado",
          tertiaryEmotions: ["Relajado", "Suelto", "Calmado"].sort()
        },
        {
          id: "relieved",
          name: "Aliviado",
          tertiaryEmotions: ["Liberado", "Calmado", "Reconfortado", "Apaciguado"].sort()
        },
        {
          id: "satisfied",
          name: "Satisfecho",
          tertiaryEmotions: ["Contento", "Complacido", "Gratificado"].sort()
        },
        {
          id: "serene",
          name: "Sereno",
          tertiaryEmotions: ["Tranquilo", "Sin preocupaciones", "Plácido", "Fluido"].sort()
        },
        {
          id: "still",
          name: "Quieto",
          tertiaryEmotions: ["Inmóvil", "Asentado", "Descansado"].sort()
        },
        {
          id: "tranquil",
          name: "Tranquilo",
          tertiaryEmotions: ["Reconfortante", "Imperturbado", "Pacífico"].sort()
        },
        {
          id: "trusting",
          name: "Confiado",
          tertiaryEmotions: ["Confiado", "Seguro", "Fiel"].sort()
        }
      ].sort((a, b) => a.name.localeCompare(b.name, 'es'))
    }
  ].sort((a, b) => a.name.localeCompare(b.name, 'es'));
};
