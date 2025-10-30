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
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      convertDetectedLanguage: (lng: string) => lng.split('-')[0]
    },
    debug: true,
    returnEmptyString: false,
    returnNull: false,
    load: 'languageOnly',
    react: {
      useSuspense: false
    }
  });

export default i18n;
