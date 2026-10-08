import { type ReactNode, useState } from 'react';
import { useI18n } from '@/i18n';

type DashboardCardProps = {
    title: string;
    description?: string;
    action?: ReactNode;
    children: ReactNode;
    // When provided, the card offers a chart/table toggle so values are never chart-only.
    table?: ReactNode;
    className?: string;
};

export function DashboardCard({
    title,
    description,
    action,
    children,
    table,
    className = '',
}: DashboardCardProps) {
    const { t } = useI18n();
    const [showTable, setShowTable] = useState(false);

    return (
        <section
            className={`flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}
        >
            <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div className="min-w-0">
                    <h3 className="text-base font-semibold text-slate-900">
                        {title}
                    </h3>
                    {description && (
                        <p className="mt-0.5 text-xs text-slate-500">
                            {description}
                        </p>
                    )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    {table && (
                        <button
                            className="min-h-0 cursor-pointer rounded-md bg-transparent px-2 py-1 text-xs font-semibold text-primary-600 hover:bg-primary-50"
                            type="button"
                            onClick={() => setShowTable((current) => !current)}
                        >
                            {showTable
                                ? t('dashboard.common.showChart')
                                : t('dashboard.common.showTable')}
                        </button>
                    )}
                    {action}
                </div>
            </header>
            <div className="flex-1 p-5">
                {table && showTable ? (
                    <div className="max-h-80 overflow-auto">{table}</div>
                ) : (
                    children
                )}
            </div>
        </section>
    );
}
