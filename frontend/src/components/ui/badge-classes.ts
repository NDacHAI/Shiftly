export type BadgeTone =
    | 'neutral'
    | 'primary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info';

export const badgeToneClasses: Record<BadgeTone, string> = {
    neutral: 'bg-slate-100 text-slate-600 ring-slate-200',
    primary: 'bg-primary-50 text-primary-700 ring-primary-100',
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    warning: 'bg-amber-50 text-amber-700 ring-amber-100',
    danger: 'bg-red-50 text-red-700 ring-red-100',
    info: 'bg-sky-50 text-sky-700 ring-sky-100',
};

export const badgeClass =
    'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset';
