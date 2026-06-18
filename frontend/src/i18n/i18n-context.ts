import { createContext, useContext } from 'react';
import { type I18nKey, type Language } from './types';

export type I18nContextValue = {
    language: Language;
    setLanguage: (language: Language) => void;
    t: (key: I18nKey) => string;
};

export const I18nContext = createContext<I18nContextValue | null>(null);

export function useI18n() {
    const context = useContext(I18nContext);

    if (!context) {
        throw new Error('useI18n must be used inside I18nProvider');
    }

    return context;
}
