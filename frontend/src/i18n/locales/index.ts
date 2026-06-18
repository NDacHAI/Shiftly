import { en } from './en';
import { vi } from './vi';

export const locales = {
    en,
    vi,
} as const;

export type TranslationKey = typeof en;
