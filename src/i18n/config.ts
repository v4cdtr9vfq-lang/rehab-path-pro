import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import es from './locales/es.json';
import en from './locales/en.json';
import emotionsEs from './locales/emotions-es.json';
import emotionsEn from './locales/emotions-en.json';

// Clear i18next cache to force reload
if (typeof window !== 'undefined') {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('i18next')) {
      localStorage.removeItem(key);
    }
  });
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { 
        translation: es,
        emotions: emotionsEs.emotions
      },
      en: { 
        translation: en,
        emotions: emotionsEn.emotions
      },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage'],
    },
    debug: false,
    returnEmptyString: false,
    returnNull: false,
  });

export default i18n;
