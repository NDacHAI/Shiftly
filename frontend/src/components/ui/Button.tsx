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
    primary: 'bg-primary-600 text-white hover:bg-primary-700',
    secondary:
        'border border-slate-200 bg-white text-slate-700 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800',
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: 'min-h-9 px-3 text-sm',
    md: 'min-h-10 px-5 text-sm',
    lg: 'min-h-11 px-5 text-sm',
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
            className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
            disabled={disabled || loading}
            type={type}
            {...props}
        >
            {loading ? loadingLabel : children}
        </button>
    );
}
