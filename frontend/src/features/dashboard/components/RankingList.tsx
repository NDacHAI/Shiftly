import { useI18n } from '@/i18n';
import { formatHours, interpolate } from '../lib/format';
import { type DashboardEmployeeRanking } from '../types';
import { DashboardCard } from './DashboardCard';

type RankingListProps = {
    title: string;
    description: string;
    items: DashboardEmployeeRanking[];
    countLabel: string;
    metric: 'minutes' | 'hours';
};

export function RankingList({
    title,
    description,
    items,
    countLabel,
    metric,
}: RankingListProps) {
    const { language, t } = useI18n();
    const maxMinutes = Math.max(1, ...items.map((item) => item.minutes));

    return (
        <DashboardCard description={description} title={title}>
            {items.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                    {t('dashboard.common.noData')}
                </p>
            ) : (
                <ol className="grid gap-3">
                    {items.map((item, index) => (
                        <li key={item.employeeId}>
                            <div className="flex items-baseline justify-between gap-3 text-sm">
                                <span className="min-w-0 truncate text-slate-700">
                                    <span className="mr-2 font-semibold text-slate-400">
                                        {index + 1}
                                    </span>
                                    {item.employeeCode} - {item.employeeName}
                                </span>
                                <strong className="shrink-0 text-slate-900 tabular-nums">
                                    {metric === 'hours'
                                        ? `${formatHours(item.minutes, language)} ${t('dashboard.common.hoursUnit')}`
                                        : `${item.minutes} ${t('dashboard.common.minutesUnit')}`}
                                </strong>
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                        className="h-full rounded-full bg-primary-500"
                                        style={{
                                            width: `${(item.minutes / maxMinutes) * 100}%`,
                                        }}
                                    />
                                </div>
                                <span className="shrink-0 text-xs text-slate-500">
                                    {interpolate(countLabel, { count: item.count })}
                                </span>
                            </div>
                        </li>
                    ))}
                </ol>
            )}
        </DashboardCard>
    );
}
