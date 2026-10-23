import { type ReactNode } from 'react';

type EmptyStateProps = {
    action?: ReactNode;
    description?: string;
    icon?: ReactNode;
    title: string;
};

export function EmptyState({
    action,
    description,
    icon,
    title,
}: EmptyStateProps) {
    return (
        <div className="mx-auto flex max-w-md flex-col items-center px-5 py-14 text-center">
            {icon && (
                <span className="mb-3 flex size-11 items-center justify-center rounded-xl bg-stone text-muted">
                    {icon}
                </span>
            )}
            <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
            {description && (
                <p className="mt-1.5 text-[13px] leading-5 text-muted">
                    {description}
                </p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
