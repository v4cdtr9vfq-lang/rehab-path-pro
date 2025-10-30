import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import es from './locales/es.json';
import en from './locales/en.json';
import emotionsEs from './locales/emotions-es.json';
import emotionsEn from './locales/emotions-en.json';

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
    supportedLngs: ['en', 'es'],
    fallbackLng: 'en', // Default to English for non-Spanish browsers
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      lookupQuerystring: 'lang',
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
      convertDetectedLanguage: (lng: string) => {
        const language = lng.split('-')[0];
        // Only return 'es' if browser is Spanish, otherwise use 'en'
        return language === 'es' ? 'es' : 'en';
      }
    },
    debug: false,
    returnEmptyString: false,
    returnNull: false,
    load: 'languageOnly',
    react: {
      useSuspense: false
    }
  });

export default i18n;
