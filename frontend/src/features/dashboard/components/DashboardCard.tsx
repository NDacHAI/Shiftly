import { type ReactNode, useState } from 'react';
import { useI18n } from '@/i18n';

type DashboardCardProps = {
    title: string;
    description?: string;
    action?: ReactNode;
    children: ReactNode;
    // When provided, the card offers a chart/table toggle so values are never chart-only.
    table?: ReactNode;
    // Rows run edge to edge (lists, tables); the header keeps its padding.
    flush?: boolean;
    className?: string;
};

export function DashboardCard({
    title,
    description,
    action,
    children,
    table,
    flush = false,
    className = '',
}: DashboardCardProps) {
    const { t } = useI18n();
    const [showTable, setShowTable] = useState(false);

    return (
        <section
            className={`flex min-w-0 flex-col gap-4 rounded-[14px] border border-rule bg-paper pt-[22px] ${
                flush ? 'pb-2' : 'pb-6'
            } ${className}`}
        >
            <header className="flex flex-wrap items-start justify-between gap-3 px-6 max-sm:px-4">
                <div className="min-w-0">
                    <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">
                        {title}
                    </h2>
                    {description && (
                        <p className="mt-1 text-[13px] text-muted">{description}</p>
                    )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                    {action}
                    {table && (
                        <button
                            className="min-h-0 cursor-pointer rounded-md border border-rule-strong bg-transparent px-2.5 py-1 text-xs font-medium text-ink hover:bg-stone-soft"
                            type="button"
                            onClick={() => setShowTable((current) => !current)}
                        >
                            {showTable
                                ? t('dashboard.common.showChart')
                                : t('dashboard.common.showTable')}
                        </button>
                    )}
                </div>
            </header>
            <div className={`flex-1 ${flush ? '' : 'px-6 max-sm:px-4'}`}>
                {table && showTable ? (
                    <div className="max-h-80 overflow-auto">{table}</div>
                ) : (
                    children
                )}
            </div>
        </section>
    );
}
