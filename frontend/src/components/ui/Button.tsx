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
    primary:
        'bg-primary-600 text-white shadow-xs hover:bg-primary-700 active:bg-primary-800',
    secondary:
        'border border-slate-200 bg-white text-slate-700 shadow-xs hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900',
    danger: 'bg-red-600 text-white shadow-xs hover:bg-red-700',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: 'min-h-8 px-3 text-[13px]',
    md: 'min-h-9 px-3.5 text-sm',
    lg: 'min-h-10 px-4 text-sm',
    icon: 'size-9 min-h-0 p-0',
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
            className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
            disabled={disabled || loading}
            type={type}
            {...props}
        >
            {loading ? loadingLabel : children}
        </button>
    );
}
