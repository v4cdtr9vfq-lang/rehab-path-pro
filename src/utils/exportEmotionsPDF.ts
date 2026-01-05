import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Extend jsPDF type for autoTable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
  }
}

interface EmotionCategory {
  name: string;
  secondaryEmotions: {
    name: string;
    tertiaryEmotions: string[];
  }[];
}

const emotionsData: EmotionCategory[] = [
  {
    name: "Alegría",
    secondaryEmotions: [
      { name: "Descansado", tertiaryEmotions: ["Renovado", "Restaurado", "Revitalizado", "Revivido"] },
      { name: "Entusiasmado", tertiaryEmotions: ["Animado", "Apasionado", "Ardiente", "Asombrado", "Deslumbrado", "Enérgico", "Entusiasta", "Sorprendido", "Vibrante", "Vigorizado"] },
      { name: "Esperanzado", tertiaryEmotions: ["Alentado", "Optimista"] },
      { name: "Eufórico", tertiaryEmotions: ["Arrebatado", "Dichoso", "Embelesado", "Exaltado", "Extático", "Exuberante", "Hechizado", "Radiante"] },
      { name: "Inspirado", tertiaryEmotions: [] },
      { name: "Pleno", tertiaryEmotions: ["Gratitud", "Paz", "Satisfacción", "Trascendencia"] }
    ]
  },
  {
    name: "Asco",
    secondaryEmotions: [
      { name: "Repugnancia", tertiaryEmotions: ["Náusea", "Negación", "Repulsión"] }
    ]
  },
  {
    name: "Confusión",
    secondaryEmotions: [
      { name: "Desorientado", tertiaryEmotions: ["Aturdido", "Perdido"] }
    ]
  },
  {
    name: "Inseguridad",
    secondaryEmotions: [
      { name: "Avergonzado", tertiaryEmotions: ["Cohibido", "Culpable", "Mortificado", "Perturbado"] },
      { name: "Impaciente", tertiaryEmotions: ["Agobiado", "Desesperado", "Expectante", "Intolerante"] },
      { name: "Inquieto", tertiaryEmotions: ["Agitado", "Alarmado", "Alterado", "Desconcertado", "Perturbado", "Sobresaltado", "Turbulento"] },
      { name: "Vulnerable", tertiaryEmotions: ["Frágil", "Indefenso", "Reservado", "Sensible", "Tembloroso"] }
    ]
  },
  {
    name: "Irritación",
    secondaryEmotions: [
      { name: "Aburrido", tertiaryEmotions: ["Apático", "Indiferente"] },
      { name: "Cansado", tertiaryEmotions: ["Exhausto", "Fatigado"] },
      { name: "Deseoso", tertiaryEmotions: ["Anhelo", "Ansia", "Codicia", "Codicioso", "Hambriento", "Obsesión"] },
      { name: "Enojado", tertiaryEmotions: ["Enfurecido", "Furioso", "Indignado", "Iracundo", "Resentido", "Ultrajado"] },
      { name: "Estresado", tertiaryEmotions: ["Abrumado"] },
      { name: "Frustrado", tertiaryEmotions: ["Impotente"] },
      { name: "Incómodo", tertiaryEmotions: ["Dolorido", "Intranquilo", "Violento"] },
      { name: "Molesto", tertiaryEmotions: ["Disgustado", "Exasperado"] }
    ]
  },
  {
    name: "Miedo",
    secondaryEmotions: [
      { name: "Asustado", tertiaryEmotions: ["Aprensivo", "Atemorizado", "Aterrorizado", "Cauteloso", "Desconfiado", "Despavorido", "Petrificado", "Preocupado", "Presentimiento", "Sospechoso", "Temor"] },
      { name: "Tenso", tertiaryEmotions: ["Abrumado", "Consternado", "Estresado", "Irritable", "Nervioso"] }
    ]
  },
  {
    name: "Paz",
    secondaryEmotions: [
      { name: "Aliviado", tertiaryEmotions: ["Apaciguado", "Liberado", "Reconfortado"] },
      { name: "Apacible", tertiaryEmotions: ["Gentil", "Suave", "Tranquilo"] },
      { name: "Centrado", tertiaryEmotions: ["Alineado", "Convencido", "Enfocado"] },
      { name: "Claridad", tertiaryEmotions: ["Calmado", "Enfocado", "Lúcido", "Sereno"] },
      { name: "Cómodo", tertiaryEmotions: ["Conectado", "Relajado", "Seguro"] },
      { name: "Conforme", tertiaryEmotions: ["Complacido", "Equilibrado", "Gratificado", "Neutral"] },
      { name: "Confianza", tertiaryEmotions: ["Esperanza", "Seguridad", "Tranquilidad"] },
      { name: "Ecuánime", tertiaryEmotions: ["Conectado"] },
      { name: "Realizado", tertiaryEmotions: ["Completo"] },
      { name: "Satisfecho", tertiaryEmotions: ["Complacido", "Contento", "Gratificado"] },
      { name: "Sereno", tertiaryEmotions: ["Calmado", "Conectado"] },
      { name: "Tranquilo", tertiaryEmotions: ["Equilibrado", "Estable", "Relajado"] }
    ]
  },
  {
    name: "Seguridad",
    secondaryEmotions: [
      { name: "Abierto", tertiaryEmotions: ["Accesible", "Disponible", "Receptivo", "Sincero", "Transparente"] },
      { name: "Afectuoso", tertiaryEmotions: ["Amigable", "Amoroso", "Cálido", "Compasivo", "Generoso", "Simpático", "Tierno"] },
      { name: "Afirmación", tertiaryEmotions: ["Certeza", "Convicción", "Firmeza", "Resolución"] },
      { name: "Agradecido", tertiaryEmotions: ["Asombro", "Reconocimiento"] },
      { name: "Comprometido", tertiaryEmotions: ["Absorto", "Alerta", "Curioso", "Estimulado", "Interesado", "Intrigado", "Involucrado"] },
      { name: "Conectado", tertiaryEmotions: ["Aceptación", "Confianza", "Feliz", "Intimidad", "Pertenencia", "Previsibilidad", "Vulnerable"] },
      { name: "Empoderado", tertiaryEmotions: ["Autónomo", "Capaz", "Confiado", "Fuerte", "Valioso"] },
      { name: "Esperanzado", tertiaryEmotions: ["Alentado", "Optimista"] },
      { name: "Satisfecho", tertiaryEmotions: ["Aliviado", "Complacido", "Contento", "Realizado"] }
    ]
  },
  {
    name: "Tristeza",
    secondaryEmotions: [
      { name: "Deprimido", tertiaryEmotions: ["Abatido", "Desalentado", "Desanimado", "Desesperanzado", "Sin valor"] },
      { name: "Desanimado", tertiaryEmotions: ["Derrotado", "Descorazonado", "Desilusionado", "Desmoralizado"] },
      { name: "Solo", tertiaryEmotions: ["Aislado", "Descuidado", "No deseado"] }
    ]
  }
];

export const downloadEmotionsPDF = () => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Listado de Emociones - Diario de Emociones", 14, 20);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, 14, 28);
  
  let yPosition = 38;
  
  emotionsData.forEach((category, index) => {
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    // Category header
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(79, 70, 229); // Primary color
    doc.text(`${index + 1}. ${category.name.toUpperCase()}`, 14, yPosition);
    yPosition += 8;
    
    // Table data for this category
    const tableData = category.secondaryEmotions.map(secondary => [
      secondary.name,
      secondary.tertiaryEmotions.length > 0 
        ? secondary.tertiaryEmotions.join(", ") 
        : "(sin terciarias)"
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [["Emoción Secundaria", "Emociones Terciarias"]],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9,
        textColor: 50
      },
      columnStyles: {
        0: { cellWidth: 40, fontStyle: 'bold' },
        1: { cellWidth: 'auto' }
      },
      margin: { left: 14, right: 14 },
      didDrawPage: () => {
        // Footer
        doc.setFontSize(8);
        doc.setTextColor(128);
        doc.text(
          `Página ${doc.getNumberOfPages()}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }
    });
    
    // Get the final Y position after the table
    const finalY = (doc as any).lastAutoTable?.finalY ?? yPosition;
    yPosition = finalY + 12;
  });

  // Summary at the end
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text("Resumen:", 14, yPosition);
  yPosition += 8;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  const totalSecondary = emotionsData.reduce((acc, cat) => acc + cat.secondaryEmotions.length, 0);
  const totalTertiary = emotionsData.reduce((acc, cat) => 
    acc + cat.secondaryEmotions.reduce((acc2, sec) => acc2 + sec.tertiaryEmotions.length, 0), 0);
  
  doc.text(`• Categorías Primarias: ${emotionsData.length}`, 14, yPosition);
  yPosition += 6;
  doc.text(`• Emociones Secundarias: ${totalSecondary}`, 14, yPosition);
  yPosition += 6;
  doc.text(`• Emociones Terciarias: ${totalTertiary}`, 14, yPosition);
  
  // Save the PDF
  doc.save("listado-emociones.pdf");
};
