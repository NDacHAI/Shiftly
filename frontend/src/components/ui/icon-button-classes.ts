export type IconButtonTone =
    | 'neutral'
    | 'primary'
    | 'success'
    | 'warning'
    | 'danger';

export const iconButtonToneClasses: Record<IconButtonTone, string> = {
    neutral: 'text-muted hover:bg-stone hover:text-ink',
    primary: 'text-muted hover:bg-stone hover:text-ink',
    success: 'text-muted hover:bg-[#dff0e4] hover:text-[#1f6237]',
    warning: 'text-muted hover:bg-ember-tint hover:text-ember-ink',
    danger: 'text-muted hover:bg-ember-tint hover:text-ember-strong',
};

export const iconButtonClass =
    'inline-flex size-7 min-h-0 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent p-0 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-ink/25 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent';
