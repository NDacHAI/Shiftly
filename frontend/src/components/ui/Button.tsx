import {
    type ButtonHTMLAttributes,
    type ReactNode,
} from 'react';

export type ButtonVariant =
    | 'primary'
    | 'secondary'
    | 'danger'
    | 'ghost';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    loading?: boolean;
    loadingLabel?: ReactNode;
    size?: ButtonSize;
    variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
    primary: 'border-0 bg-ink text-sand hover:bg-ink-soft',
    secondary:
        'border border-rule-strong bg-transparent text-ink hover:bg-stone-soft',
    danger: 'border-0 bg-ember-strong text-white hover:bg-ember-ink',
    ghost: 'border-0 bg-transparent text-muted hover:bg-stone hover:text-ink',
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: 'min-h-8 px-3 text-[13px]',
    md: 'min-h-9 px-3.5 text-[13px]',
    lg: 'min-h-[38px] px-4 text-[13px]',
    icon: 'size-8 min-h-0 rounded-md p-0 text-xs',
};

export function Button({
    children,
    className = '',
    disabled,
    loading = false,
    loadingLabel = 'Đang xử lý...',
    size = 'md',
    type = 'button',
    variant = 'primary',
    ...props
}: ButtonProps) {
    return (
        <button
            aria-busy={loading || undefined}
            className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ink/25 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
            disabled={disabled || loading}
            type={type}
            {...props}
        >
            {loading ? loadingLabel : children}
        </button>
    );
}
