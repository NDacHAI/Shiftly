export type IconButtonTone =
    | 'neutral'
    | 'primary'
    | 'success'
    | 'warning'
    | 'danger';

export const iconButtonToneClasses: Record<IconButtonTone, string> = {
    neutral: 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
    primary: 'text-slate-500 hover:bg-primary-50 hover:text-primary-700',
    success: 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-700',
    warning: 'text-slate-500 hover:bg-amber-50 hover:text-amber-700',
    danger: 'text-slate-500 hover:bg-red-50 hover:text-red-600',
};

export const iconButtonClass =
    'inline-flex size-8 min-h-0 cursor-pointer items-center justify-center rounded-lg p-0 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent';
