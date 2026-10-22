import { useI18n } from '@/i18n';
import { formatHours, formatPercent, interpolate } from '../lib/format';
import { type DashboardBranchStats } from '../types';
import { DashboardCard } from './DashboardCard';

const columns =
    'grid grid-cols-[minmax(160px,1.4fr)_repeat(4,minmax(90px,1fr))_minmax(140px,1.2fr)] gap-3 px-6 max-sm:px-4';

type BranchStatsTableProps = {
    rows: DashboardBranchStats[];
    days: number;
};

export function BranchStatsTable({ rows, days }: BranchStatsTableProps) {
    const { language, t } = useI18n();
    const hoursUnit = t('dashboard.common.hoursUnit');

    return (
        <DashboardCard
            flush
            title={interpolate(t('dashboard.branches.title'), { days })}
        >
            {rows.length === 0 ? (
                <p className="px-6 py-10 text-center text-[13px] text-muted">
                    {t('dashboard.branches.empty')}
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <div className="min-w-[640px]" role="table">
                        <div
                            className={`${columns} border-b border-rule py-2.5 text-xs text-muted`}
                            role="row"
                        >
                            <span role="columnheader">{t('dashboard.branches.branch')}</span>
                            <span className="text-right" role="columnheader">
                                {t('dashboard.branches.employees')}
                            </span>
                            <span className="text-right" role="columnheader">
                                {t('dashboard.branches.workedHours')}
                            </span>
                            <span className="text-right" role="columnheader">
                                {t('dashboard.branches.overtime')}
                            </span>
                            <span className="text-right" role="columnheader">
                                {t('dashboard.branches.late')}
                            </span>
                            <span role="columnheader">{t('dashboard.branches.onTimeRate')}</span>
                        </div>
                        {rows.map((row) => {
                            const onTimeRate = row.attended > 0 ? row.onTime / row.attended : null;

                            return (
                                <div
                                    className={`${columns} items-center border-b border-rule-soft py-3.5 text-sm text-ink tabular-nums last:border-b-0`}
                                    key={row.branchId}
                                    role="row"
                                >
                                    <span className="truncate font-semibold" role="cell">
                                        {row.branchName}
                                    </span>
                                    <span className="text-right" role="cell">
                                        {row.employees}
                                    </span>
                                    <span className="text-right" role="cell">
                                        {formatHours(row.workedMinutes, language)}
                                    </span>
                                    <span className="text-right" role="cell">
                                        {formatHours(row.overtimeMinutes, language)} {hoursUnit}
                                    </span>
                                    <span className="text-right" role="cell">
                                        {row.late}
                                    </span>
                                    <div className="flex items-center gap-2.5" role="cell">
                                        <div className="h-1.5 flex-1 overflow-hidden rounded-[3px] bg-stone">
                                            <div
                                                className="h-full bg-ink"
                                                style={{ width: `${(onTimeRate ?? 0) * 100}%` }}
                                            />
                                        </div>
                                        <span className="w-12 text-right text-[13px]">
                                            {onTimeRate === null
                                                ? '—'
                                                : formatPercent(onTimeRate, language)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </DashboardCard>
    );
}
