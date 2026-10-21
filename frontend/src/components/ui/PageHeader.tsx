import { type ReactNode } from 'react';

type PageHeaderProps = {
    actions?: ReactNode;
    description?: ReactNode;
    icon?: ReactNode;
    title: ReactNode;
};

export function PageHeader({
    actions,
    description,
    icon,
    title,
}: PageHeaderProps) {
    return (
        <div className="flex items-center justify-between gap-4 max-md:flex-col max-md:items-stretch">
            <div className="flex min-w-0 items-center gap-3.5">
                {icon && (
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-base text-primary-600 shadow-card ring-1 ring-line">
                        {icon}
                    </span>
                )}
                <div className="min-w-0">
                    <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                        {title}
                    </h2>
                    {description && (
                        <p className="mt-0.5 text-sm text-slate-500">
                            {description}
                        </p>
                    )}
                </div>
            </div>
            {actions && (
                <div className="flex flex-wrap items-center gap-2">
                    {actions}
                </div>
            )}
        </div>
    );
}
