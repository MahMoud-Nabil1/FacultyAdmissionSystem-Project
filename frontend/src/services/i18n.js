import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from '../locales/ar.json';
import en from '../locales/en.json';

const STORAGE_KEY = 'appLanguage';

function getInitialLanguage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return stored;
    } catch {
        // ignore storage errors
    }
    return 'ar';
}

i18n
    .use(initReactI18next)
    .init({
        resources: {
            ar: { translation: ar },
            en: { translation: en },
        },
        lng: getInitialLanguage(),
        fallbackLng: 'en',
        supportedLngs: ['ar', 'en'],
        interpolation: { escapeValue: false },
    });

export default i18n;
