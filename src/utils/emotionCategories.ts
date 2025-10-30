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
        id: "alegre",
        name: "Joy",
        secondaryEmotions: [
          {
            id: "descansado",
            name: "Rested",
            tertiaryEmotions: ["Renewed", "Restored", "Revitalized", "Revived"]
          },
          {
            id: "entusiasmado",
            name: "Excited",
            tertiaryEmotions: ["Animated", "Passionate", "Fiery", "Amazed", "Dazzled", "Energetic", "Enthusiastic", "Surprised", "Vibrant", "Invigorated"]
          },
          {
            id: "esperanzado",
            name: "Hopeful",
            tertiaryEmotions: ["Encouraged", "Optimistic"]
          },
          {
            id: "euforico",
            name: "Euphoric",
            tertiaryEmotions: ["Enraptured", "Blissful", "Enchanted", "Exalted", "Ecstatic", "Exuberant", "Bewitched", "Radiant"]
          },
          {
            id: "inspirado",
            name: "Inspired",
            tertiaryEmotions: []
          },
          {
            id: "pleno",
            name: "Fulfilled",
            tertiaryEmotions: ["Gratitude", "Peace", "Satisfaction", "Transcendence"]
          }
        ]
      },
      {
        id: "asco",
        name: "Disgust",
        secondaryEmotions: [
          {
            id: "disgusto",
            name: "Disgust",
            tertiaryEmotions: ["Discontent", "Dissatisfaction", "Annoyance"]
          },
          {
            id: "rechazo_asco",
            name: "Rejection",
            tertiaryEmotions: ["Exclusion", "Denial", "Repudiation"]
          },
          {
            id: "repugnancia",
            name: "Repugnance",
            tertiaryEmotions: ["Nausea", "Repellent", "Repulsion"]
          }
        ]
      },
      {
        id: "confundido",
        name: "Confusion",
        secondaryEmotions: [
          {
            id: "desorientado",
            name: "Disoriented",
            tertiaryEmotions: ["Dazed", "Lost"]
          }
        ]
      },
      {
        id: "vulnerable",
        name: "Insecurity",
        secondaryEmotions: [
          {
            id: "avergonzado",
            name: "Ashamed",
            tertiaryEmotions: ["Self-conscious", "Guilty", "Mortified", "Embarrassed"]
          },
          {
            id: "impaciente",
            name: "Impatient",
            tertiaryEmotions: ["Overwhelmed", "Desperate", "Expectant", "Intolerant"]
          },
          {
            id: "incomodo",
            name: "Uncomfortable",
            tertiaryEmotions: ["Uneasy"]
          },
          {
            id: "inquieto",
            name: "Restless",
            tertiaryEmotions: ["Agitation", "Agitated", "Alarmed", "Upset", "Disconcerted", "Disturbed", "Startled", "Turbulent"]
          },
          {
            id: "vulnerable",
            name: "Vulnerable",
            tertiaryEmotions: ["Fragile", "Helpless", "Reserved", "Sensitive", "Trembling"]
          }
        ]
      },
      {
        id: "irritado",
        name: "Irritation",
        secondaryEmotions: [
          {
            id: "deseo",
            name: "Desire",
            tertiaryEmotions: ["Longing", "Craving", "Greed", "Greedy", "Hungry", "Obsession"]
          },
          {
            id: "enojado",
            name: "Angry",
            tertiaryEmotions: ["Enraged", "Furious", "Indignant", "Wrathful", "Resentful", "Outraged"]
          },
          {
            id: "frustracion",
            name: "Frustrated",
            tertiaryEmotions: ["Powerless"]
          },
          {
            id: "molesto",
            name: "Annoyed",
            tertiaryEmotions: ["Disgusted", "Exasperated"]
          }
        ]
      },
      {
        id: "miedo",
        name: "Fear",
        secondaryEmotions: [
          {
            id: "asustado",
            name: "Scared",
            tertiaryEmotions: ["Apprehensive", "Frightened", "Terrified", "Cautious", "Distrustful", "Panicked", "Petrified", "Worried", "Foreboding", "Suspicious", "Dread"]
          },
          {
            id: "tenso",
            name: "Tense",
            tertiaryEmotions: ["Overwhelmed", "Dismayed", "Stressed", "Irritable", "Nervous"]
          }
        ]
      },
      {
        id: "conectado",
        name: "Security",
        secondaryEmotions: [
          {
            id: "abierto",
            name: "Open",
            tertiaryEmotions: ["Accessible", "Available", "Receptive", "Sincere", "Transparent"]
          },
          {
            id: "afectuoso",
            name: "Affectionate",
            tertiaryEmotions: ["Friendly", "Loving", "Warm", "Compassionate", "Generous", "Sympathetic", "Tender"]
          },
          {
            id: "afirmacion",
            name: "Affirmation",
            tertiaryEmotions: ["Certainty", "Conviction", "Firmness", "Resolution"]
          },
          {
            id: "agradecido",
            name: "Grateful",
            tertiaryEmotions: ["Amazement", "Recognition"]
          },
          {
            id: "comprometido",
            name: "Engaged",
            tertiaryEmotions: ["Absorbed", "Alert", "Curious", "Stimulated", "Interested", "Intrigued", "Involved"]
          },
          {
            id: "seguro",
            name: "Connected",
            tertiaryEmotions: ["Acceptance", "Trust", "Happy", "Intimacy", "Belonging", "Predictability"]
          },
          {
            id: "empoderado",
            name: "Empowered",
            tertiaryEmotions: ["Autonomous", "Capable", "Confident", "Strong", "Valuable"]
          },
          {
            id: "esperanzado_conectado",
            name: "Hopeful",
            tertiaryEmotions: ["Encouraged", "Optimistic"]
          },
          {
            id: "satisfecho",
            name: "Satisfied",
            tertiaryEmotions: ["Accomplished", "Content", "Fulfilled", "Relieved"]
          }
        ]
      },
      {
        id: "triste",
        name: "Sadness",
        secondaryEmotions: [
          {
            id: "decepcionado",
            name: "Disappointed",
            tertiaryEmotions: ["Betrayed", "Disillusioned", "Disheartened", "Frustrated", "Let down"]
          },
          {
            id: "deprimido",
            name: "Depressed",
            tertiaryEmotions: ["Dejected", "Despondent", "Discouraged", "Hopeless", "Worthless"]
          },
          {
            id: "desanimado",
            name: "Discouraged",
            tertiaryEmotions: ["Defeated", "Demoralized"]
          },
          {
            id: "herido",
            name: "Hurt",
            tertiaryEmotions: ["Abandoned", "Devastated", "Grief", "Offended", "Rejected"]
          },
          {
            id: "solo",
            name: "Lonely",
            tertiaryEmotions: ["Isolated", "Neglected", "Unwanted"]
          }
        ]
      }
    ];
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
          tertiaryEmotions: ["Renovado", "Restaurado", "Revitalizado", "Revivido"]
        },
        {
          id: "entusiasmado",
          name: "Entusiasmado",
          tertiaryEmotions: ["Animado", "Apasionado", "Ardiente", "Asombrado", "Deslumbrado", "Enérgico", "Entusiasta", "Sorprendido", "Vibrante", "Vigorizado"]
        },
        {
          id: "esperanzado",
          name: "Esperanzado",
          tertiaryEmotions: ["Alentado", "Optimista"]
        },
        {
          id: "euforico",
          name: "Eufórico",
          tertiaryEmotions: ["Arrebatado", "Dichoso", "Embelesado", "Exaltado", "Extático", "Exuberante", "Hechizado", "Radiante"]
        },
        {
          id: "inspirado",
          name: "Inspirado",
          tertiaryEmotions: []
        },
        {
          id: "pleno",
          name: "Pleno",
          tertiaryEmotions: ["Gratitud", "Paz", "Satisfacción", "Trascendencia"]
        }
      ]
    },
    {
      id: "asco",
      name: "Asco",
      secondaryEmotions: [
        {
          id: "disgusto",
          name: "Disgusto",
          tertiaryEmotions: ["Descontento", "Insatisfacción", "Molestia"]
        },
        {
          id: "rechazo_asco",
          name: "Rechazo",
          tertiaryEmotions: ["Exclusión", "Negación", "Repudio"]
        },
        {
          id: "repugnancia",
          name: "Repugnancia",
          tertiaryEmotions: ["Náusea", "Repelente", "Repulsión"]
        }
      ]
    },
    {
      id: "confundido",
      name: "Confusión",
      secondaryEmotions: [
        {
          id: "desorientado",
          name: "Desorientado",
          tertiaryEmotions: ["Aturdido", "Perdido"]
        }
      ]
    },
    {
      id: "vulnerable",
      name: "Inseguridad",
      secondaryEmotions: [
        {
          id: "avergonzado",
          name: "Avergonzado",
          tertiaryEmotions: ["Cohibido", "Culpable", "Mortificado", "Turbado"]
        },
        {
          id: "impaciente",
          name: "Impaciente",
          tertiaryEmotions: ["Agobiado", "Desesperado", "Expectante", "Intolerante"]
        },
        {
          id: "incomodo",
          name: "Incómodo",
          tertiaryEmotions: ["Intranquilo"]
        },
        {
          id: "inquieto",
          name: "Inquieto",
          tertiaryEmotions: ["Agitación", "Agitado", "Alarmado", "Alterado", "Desconcertado", "Perturbado", "Sobresaltado", "Turbulento"]
        },
        {
          id: "vulnerable",
          name: "Vulnerable",
          tertiaryEmotions: ["Frágil", "Indefenso", "Reservado", "Sensible", "Tembloroso"]
        }
      ]
    },
    {
      id: "irritado",
      name: "Irritación",
      secondaryEmotions: [
        {
          id: "deseo",
          name: "Deseo",
          tertiaryEmotions: ["Anhelo", "Ansia", "Codicia", "Codicioso", "Hambriento", "Obsesión"]
        },
        {
          id: "enojado",
          name: "Enojado",
          tertiaryEmotions: ["Enfurecido", "Furioso", "Indignado", "Iracundo", "Resentido", "Ultrajado"]
        },
        {
          id: "frustracion",
          name: "Frustrado",
          tertiaryEmotions: ["Impotente"]
        },
        {
          id: "molesto",
          name: "Molesto",
          tertiaryEmotions: ["Disgustado", "Exasperado"]
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
          tertiaryEmotions: ["Aprensivo", "Atemorizado", "Aterrorizado", "Cauteloso", "Desconfiado", "En pánico", "Petrificado", "Preocupado", "Presentimiento", "Sospechoso", "Temor"]
        },
        {
          id: "tenso",
          name: "Tenso",
          tertiaryEmotions: ["Abrumado", "Consternado", "Estresado", "Irritable", "Nervioso"]
        }
      ]
    },
    {
      id: "conectado",
      name: "Seguridad",
      secondaryEmotions: [
        {
          id: "abierto",
          name: "Abierto",
          tertiaryEmotions: ["Accesible", "Disponible", "Receptivo", "Sincero", "Transparente"]
        },
        {
          id: "afectuoso",
          name: "Afectuoso",
          tertiaryEmotions: ["Amigable", "Amoroso", "Cálido", "Compasivo", "Generoso", "Simpático", "Tierno"]
        },
        {
          id: "afirmacion",
          name: "Afirmación",
          tertiaryEmotions: ["Certeza", "Convicción", "Firmeza", "Resolución"]
        },
        {
          id: "agradecido",
          name: "Agradecido",
          tertiaryEmotions: ["Asombro", "Reconocimiento"]
        },
        {
          id: "comprometido",
          name: "Comprometido",
          tertiaryEmotions: ["Absorto", "Alerta", "Curioso", "Estimulado", "Interesado", "Intrigado", "Involucrado"]
        },
        {
          id: "seguro",
          name: "Conectado",
          tertiaryEmotions: ["Aceptación", "Confianza", "Feliz", "Intimidad", "Pertenencia", "Previsibilidad"]
        },
        {
          id: "empoderado",
          name: "Empoderado",
          tertiaryEmotions: ["Autónomo", "Capaz", "Confiado", "Fuerte", "Valioso"]
        },
        {
          id: "esperanzado_conectado",
          name: "Esperanzado",
          tertiaryEmotions: ["Alentado", "Optimista"]
        },
        {
          id: "satisfecho",
          name: "Satisfecho",
          tertiaryEmotions: ["Realizado", "Contento", "Complacido", "Aliviado"]
        }
      ]
    },
    {
      id: "triste",
      name: "Tristeza",
      secondaryEmotions: [
        {
          id: "decepcionado",
          name: "Decepcionado",
          tertiaryEmotions: ["Traicionado", "Desilusionado", "Descorazonado", "Frustrado", "Defraudado"]
        },
        {
          id: "deprimido",
          name: "Deprimido",
          tertiaryEmotions: ["Abatido", "Desalentado", "Desanimado", "Desesperanzado", "Sin valor"]
        },
        {
          id: "desanimado",
          name: "Desanimado",
          tertiaryEmotions: ["Derrotado", "Desmoralizado"]
        },
        {
          id: "herido",
          name: "Herido",
          tertiaryEmotions: ["Abandonado", "Devastado", "Duelo", "Ofendido", "Rechazado"]
        },
        {
          id: "solo",
          name: "Solo",
          tertiaryEmotions: ["Aislado", "Descuidado", "No deseado"]
        }
      ]
    }
  ];
};
