import { type ReactNode } from 'react';

type PageHeaderProps = {
    actions?: ReactNode;
    description?: ReactNode;
    eyebrow?: ReactNode;
    // Kept for existing callers; the dashboard-style header has no icon tile.
    icon?: ReactNode;
    title: ReactNode;
};

// Page title block from frontend/ui/Shiftly Dashboard.html.
export function PageHeader({
    actions,
    description,
    eyebrow,
    title,
}: PageHeaderProps) {
    return (
        <div className="flex flex-wrap items-end justify-between gap-5 text-ink max-md:flex-col max-md:items-stretch">
            <div className="flex min-w-0 flex-col gap-1.5">
                {eyebrow && (
                    <span className="tabular-nums text-xs tracking-[0.04em] text-muted uppercase">
                        {eyebrow}
                    </span>
                )}
                <h1 className="text-[34px] leading-tight font-semibold tracking-[-0.03em] text-pretty max-sm:text-[28px]">
                    {title}
                </h1>
                {description && (
                    <p className="text-[15px] text-muted">{description}</p>
                )}
            </div>
            {actions && (
                <div className="flex flex-wrap items-center gap-2">
                    {actions}
                </div>
            )}
        </div>
    );
}
