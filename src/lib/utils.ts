import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date, language: string = 'es'): string {
  const locale = language === 'en' ? enUS : es;
  // Spanish: "Martes, 18 de Noviembre"
  // English: "Tuesday, November 18"
  const dateFormat = language === 'en' ? "EEEE, MMMM d" : "EEEE, d 'de' MMMM";
  const formatted = format(date, dateFormat, { locale });
  
  // Capitalize day and month for Spanish
  if (language === 'es') {
    const parts = formatted.split(', ');
    const dayCapitalized = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    const rest = parts[1].split(' de ');
    const monthCapitalized = rest[1].charAt(0).toUpperCase() + rest[1].slice(1);
    return `${dayCapitalized}, ${rest[0]} de ${monthCapitalized}`;
  }
  
  return formatted;
}

export function formatDateTime(date: Date, language: string = 'es'): string {
  const locale = language === 'en' ? enUS : es;
  // Spanish: "M 10/11/2025 a las 20:43"
  // English: "T 11/10/2025 at 20:43"
  const dateFormat = language === 'en' ? "EEEEE MM/dd/yyyy 'at' HH:mm" : "EEEEE dd/MM/yyyy 'a las' HH:mm";
  const formatted = format(date, dateFormat, { locale });
  // Capitalize first letter
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}
