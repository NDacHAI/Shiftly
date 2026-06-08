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
        <div className="mx-auto flex max-w-md flex-col items-center px-5 py-10 text-center">
            {icon && (
                <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                    {icon}
                </span>
            )}
            <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
            {description && (
                <p className="mt-1 text-sm leading-5 text-slate-500">
                    {description}
                </p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
