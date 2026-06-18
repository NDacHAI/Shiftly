import {
    type ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { I18nContext } from './i18n-context';
import { locales } from './locales';
import { type I18nKey, type Language } from './types';

const languageStorageKey = 'shiftly.language';
const defaultLanguage: Language = 'vi';

function getInitialLanguage(): Language {
    const storedLanguage = localStorage.getItem(languageStorageKey);

    if (storedLanguage === 'en' || storedLanguage === 'vi') {
        return storedLanguage;
    }

    return defaultLanguage;
}

function resolveTranslation(language: Language, key: I18nKey): string {
    const value = key.split('.').reduce<unknown>((current, segment) => {
        if (!current || typeof current !== 'object') return undefined;
        return (current as Record<string, unknown>)[segment];
    }, locales[language]);

    return typeof value === 'string' ? value : key;
}

export function I18nProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>(getInitialLanguage);

    const setLanguage = useCallback((nextLanguage: Language) => {
        setLanguageState(nextLanguage);
        localStorage.setItem(languageStorageKey, nextLanguage);
    }, []);

    const t = useCallback(
        (key: I18nKey) => resolveTranslation(language, key),
        [language],
    );

    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);

    const value = useMemo(
        () => ({ language, setLanguage, t }),
        [language, setLanguage, t],
    );

    return (
        <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
    );
}
