import { locales } from './locales';

export type Language = keyof typeof locales;

export type TranslationPath<T> = T extends string
    ? never
    : {
          [K in keyof T & string]: T[K] extends string
              ? K
              : `${K}.${TranslationPath<T[K]>}`;
      }[keyof T & string];

export type I18nKey = TranslationPath<(typeof locales)['en']>;
