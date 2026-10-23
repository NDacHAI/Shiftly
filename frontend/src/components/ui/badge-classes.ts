export type BadgeTone =
    | 'neutral'
    | 'primary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info';

export const badgeToneClasses: Record<BadgeTone, string> = {
    neutral: 'bg-stone text-muted',
    primary: 'bg-ink text-sand',
    success: 'bg-[#dff0e4] text-[#1f6237]',
    warning: 'bg-ember-tint text-ember-ink',
    danger: 'bg-[#f6dcd6] text-[#9a2f1f]',
    info: 'bg-[#e1e8ee] text-[#2f4a5e]',
};

export const badgeClass =
    'inline-flex items-center gap-1.5 rounded-full px-[9px] py-[3px] text-xs font-semibold whitespace-nowrap';
