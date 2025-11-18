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
  return format(date, dateFormat, { locale });
}

export function formatDateTime(date: Date, language: string = 'es'): string {
  const locale = language === 'en' ? enUS : es;
  // Spanish: "18 de Noviembre, 2024 a las 14:30"
  // English: "November 18, 2024 at 14:30"
  const dateFormat = language === 'en' ? "MMMM d, yyyy 'at' HH:mm" : "d 'de' MMMM, yyyy 'a las' HH:mm";
  return format(date, dateFormat, { locale });
}
