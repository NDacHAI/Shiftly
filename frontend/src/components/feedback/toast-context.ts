import { createContext } from 'react';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export type ToastOptions = {
    duration?: number;
    message: string;
    title?: string;
    variant?: ToastVariant;
};

export type ToastContextValue = {
    showToast: (options: ToastOptions) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);
