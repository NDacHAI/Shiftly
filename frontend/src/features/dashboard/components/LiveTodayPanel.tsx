import { useI18n } from '@/i18n';
import { interpolate } from '../lib/format';
import { type DashboardDailyStats } from '../types';

type LiveTodayPanelProps = {
    stats: DashboardDailyStats;
    missingCheckIns: number;
};

export function LiveTodayPanel({ stats, missingCheckIns }: LiveTodayPanelProps) {
    const { t } = useI18n();
    const checkedIn = stats.onTime + stats.late;
    const expected = Math.max(stats.scheduled - stats.onLeave, 0);
    const missing = Math.min(missingCheckIns, stats.notRecorded);
    const upcoming = Math.max(stats.notRecorded - missing, 0);
    const averageLate = stats.late > 0 ? Math.round(stats.lateMinutes / stats.late) : 0;

    const kpis = [
        {
            key: 'checkedIn',
            label: t('dashboard.live.checkedIn'),
            value: checkedIn,
            unit: `/ ${expected}`,
            note: interpolate(t('dashboard.live.checkedInNote'), {
                percent: expected > 0 ? Math.round((checkedIn / expected) * 100) : 0,
            }),
            accent: false,
        },
        {
            key: 'late',
            label: t('dashboard.live.late'),
            value: stats.late,
            unit: t('dashboard.live.people'),
            note:
                stats.late > 0
                    ? interpolate(t('dashboard.live.lateNote'), { minutes: averageLate })
                    : t('dashboard.live.lateNoteEmpty'),
            accent: stats.late > 0,
        },
        {
            key: 'missing',
            label: t('dashboard.live.missing'),
            value: missing,
            unit: t('dashboard.live.people'),
            note: t('dashboard.live.missingNote'),
            accent: false,
        },
        {
            key: 'onLeave',
            label: t('dashboard.live.onLeave'),
            value: stats.onLeave,
            unit: t('dashboard.live.people'),
            note: interpolate(t('dashboard.live.onLeaveNote'), { absent: stats.absent }),
            accent: false,
        },
    ];

    // Segments share one scale (scheduled shifts) so the bar reads as today's full roster.
    const segments = [
        { key: 'onTime', label: t('dashboard.live.segments.onTime'), count: stats.onTime, color: 'bg-ink' },
        { key: 'late', label: t('dashboard.live.segments.late'), count: stats.late, color: 'bg-ember' },
        { key: 'missing', label: t('dashboard.live.segments.missing'), count: missing, color: 'bg-[#b9b3a4]' },
        { key: 'absent', label: t('dashboard.live.segments.absent'), count: stats.absent, color: 'bg-ember-ink' },
        { key: 'onLeave', label: t('dashboard.live.segments.onLeave'), count: stats.onLeave, color: 'bg-[#d6d1c5]' },
        { key: 'upcoming', label: t('dashboard.live.segments.upcoming'), count: upcoming, color: 'bg-stone' },
    ];

    return (
        <section className="flex flex-col gap-[18px] rounded-[14px] border border-rule bg-paper px-6 py-[22px] max-sm:px-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span aria-hidden="true" className="size-2 rounded-full bg-live" />
                    <h2 className="text-[13px] font-semibold text-ink">
                        {t('dashboard.live.title')}
                    </h2>
                </div>
                <span className="text-[13px] text-muted">
                    {interpolate(t('dashboard.live.scheduled'), { count: stats.scheduled })}
                </span>
            </div>

            <dl className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-y-4">
                {kpis.map((kpi) => (
                    <div
                        className="flex flex-col gap-1 border-l border-rule px-5 max-sm:px-3"
                        key={kpi.key}
                    >
                        <dt className="text-[13px] text-muted">{kpi.label}</dt>
                        <dd className="flex items-baseline gap-1.5">
                            <span
                                className={`text-[40px] leading-[1.1] font-semibold tracking-[-0.04em] tabular-nums ${
                                    kpi.accent ? 'text-ember-strong' : 'text-ink'
                                }`}
                            >
                                {kpi.value}
                            </span>
                            <span className="text-sm text-muted">{kpi.unit}</span>
                        </dd>
                        <dd className="text-xs text-muted">{kpi.note}</dd>
                    </div>
                ))}
            </dl>

            {stats.scheduled > 0 && (
                <>
                    <div aria-hidden="true" className="flex h-2.5 gap-0.5 overflow-hidden rounded-[5px]">
                        {segments
                            .filter((segment) => segment.count > 0)
                            .map((segment) => (
                                <div
                                    className={segment.color}
                                    key={segment.key}
                                    style={{ width: `${(segment.count / stats.scheduled) * 100}%` }}
                                />
                            ))}
                    </div>
                    <ul className="flex flex-wrap gap-x-[18px] gap-y-1 text-xs text-muted">
                        {segments.map((segment) => (
                            <li className="flex items-center gap-1.5" key={segment.key}>
                                <span
                                    aria-hidden="true"
                                    className={`size-2 rounded-[2px] ${segment.color}`}
                                />
                                {segment.label} · {segment.count}
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </section>
    );
}
