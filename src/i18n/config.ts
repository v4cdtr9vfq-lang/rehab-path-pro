import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import es from './locales/es.json';
import en from './locales/en.json';
import emotionsEs from './locales/emotions-es.json';
import emotionsEn from './locales/emotions-en.json';

// Force Spanish as default language - remove any previous language setting
localStorage.removeItem('i18nextLng');
localStorage.setItem('i18nextLng', 'es');

i18n
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
    lng: 'es', // Force Spanish - no browser detection
    interpolation: {
      escapeValue: false,
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
