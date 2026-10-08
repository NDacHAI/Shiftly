import { type Language } from '@/i18n';

const vietnamTimeZone = 'Asia/Ho_Chi_Minh';

function localeOf(language: Language) {
    return language === 'vi' ? 'vi-VN' : 'en-US';
}

export function formatNumber(value: number, language: Language) {
    return new Intl.NumberFormat(localeOf(language), {
        maximumFractionDigits: 1,
    }).format(value);
}

export function formatMoney(value: number, language: Language) {
    return new Intl.NumberFormat(localeOf(language), {
        maximumFractionDigits: 0,
    }).format(value);
}

export function formatCompactMoney(value: number, language: Language) {
    return new Intl.NumberFormat(localeOf(language), {
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(value);
}

export function minutesToHours(minutes: number) {
    return Math.round((minutes / 60) * 10) / 10;
}

export function formatHours(minutes: number, language: Language) {
    return formatNumber(minutesToHours(minutes), language);
}

// Dates from the API are plain `YYYY-MM-DD` strings; format them without a timezone shift.
export function formatShortDate(date: string, language: Language) {
    const [year, month, day] = date.split('-').map(Number);

    return new Intl.DateTimeFormat(localeOf(language), {
        day: '2-digit',
        month: '2-digit',
        timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function formatLongDate(date: string, language: Language) {
    const [year, month, day] = date.split('-').map(Number);

    return new Intl.DateTimeFormat(localeOf(language), {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function formatTime(value: string, language: Language) {
    return new Intl.DateTimeFormat(localeOf(language), {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: vietnamTimeZone,
    }).format(new Date(value));
}

export function interpolate(
    template: string,
    values: Record<string, string | number>,
) {
    return template.replace(/\{(\w+)\}/g, (match, key: string) =>
        key in values ? String(values[key]) : match,
    );
}
