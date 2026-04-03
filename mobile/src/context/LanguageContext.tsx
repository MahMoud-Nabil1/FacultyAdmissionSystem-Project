import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from '../locales/en.json';
import ar from '../locales/ar.json';

const STORAGE_KEY = 'app_locale';

export type Locale = 'ar' | 'en';

const MESSAGES: Record<Locale, Record<string, unknown>> = {
    en: en as Record<string, unknown>,
    ar: ar as Record<string, unknown>,
};

function getNested(obj: Record<string, unknown>, path: string): string | undefined {
    const parts = path.split('.');
    let cur: unknown = obj;
    for (const p of parts) {
        if (cur === null || typeof cur !== 'object') return undefined;
        cur = (cur as Record<string, unknown>)[p];
    }
    return typeof cur === 'string' ? cur : undefined;
}

type LanguageContextValue = {
    locale: Locale;
    setLocale: (l: Locale) => void;
    toggleLocale: () => void;
    t: (key: string, vars?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>('ar');

    useEffect(() => {
        (async () => {
            try {
                const stored = await AsyncStorage.getItem(STORAGE_KEY);
                if (stored === 'en' || stored === 'ar') setLocaleState(stored);
            } catch {
                /* ignore */
            }
        })();
    }, []);

    const setLocale = useCallback(async (l: Locale) => {
        setLocaleState(l);
        try {
            await AsyncStorage.setItem(STORAGE_KEY, l);
        } catch {
            /* ignore */
        }
    }, []);

    const toggleLocale = useCallback(() => {
        setLocale(locale === 'ar' ? 'en' : 'ar');
    }, [locale, setLocale]);

    const t = useCallback(
        (key: string, vars?: Record<string, string | number>) => {
            let s =
                getNested(MESSAGES[locale], key) ??
                getNested(MESSAGES.en, key) ??
                key;
            if (vars) {
                Object.entries(vars).forEach(([k, v]) => {
                    s = s.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), String(v));
                });
            }
            return s;
        },
        [locale]
    );

    const value = useMemo(
        () => ({ locale, setLocale, toggleLocale, t }),
        [locale, setLocale, toggleLocale, t]
    );

    return (
        <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
    );
}

export function useLanguage() {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
    return ctx;
}
