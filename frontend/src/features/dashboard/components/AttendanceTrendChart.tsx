import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { useI18n } from '@/i18n';
import { chartColors } from '../lib/chart-colors';
import {
    formatHours,
    formatPercent,
    formatShortDate,
    interpolate,
} from '../lib/format';
import { type DashboardDailyStats } from '../types';
import { ChartLegend } from './ChartLegend';
import { ChartTooltip } from './ChartTooltip';
import { DashboardCard } from './DashboardCard';

// Ranges longer than this are summed per week so bars stay readable.
const WEEKLY_AFTER_DAYS = 31;

type AttendanceBucket = {
    key: string;
    label: string;
    scheduled: number;
    onTime: number;
    late: number;
    onTimeRate: number;
    lateRate: number;
    isCurrent: boolean;
};

type AttendanceTrendChartProps = {
    data: DashboardDailyStats[];
    days: number;
    workedMinutes: number;
};

export function AttendanceTrendChart({
    data,
    days,
    workedMinutes,
}: AttendanceTrendChartProps) {
    const { language, t } = useI18n();
    const weekly = days > WEEKLY_AFTER_DAYS;
    const groups: DashboardDailyStats[][] = [];

    if (weekly) {
        // Group from the newest day backwards so the last bucket always ends today.
        for (let end = data.length; end > 0; end -= 7) {
            groups.unshift(data.slice(Math.max(end - 7, 0), end));
        }
    } else {
        groups.push(...data.map((row) => [row]));
    }

    const buckets: AttendanceBucket[] = groups.map((group, index) => {
        const scheduled = group.reduce((total, row) => total + row.scheduled, 0);
        const onTime = group.reduce((total, row) => total + row.onTime, 0);
        const late = group.reduce((total, row) => total + row.late, 0);
        const firstDate = formatShortDate(group[0].date, language);

        return {
            key: group[0].date,
            label: firstDate,
            scheduled,
            onTime,
            late,
            onTimeRate: scheduled > 0 ? (onTime / scheduled) * 100 : 0,
            lateRate: scheduled > 0 ? (late / scheduled) * 100 : 0,
            isCurrent: index === groups.length - 1,
        };
    });

    const totalOnTime = buckets.reduce((total, row) => total + row.onTime, 0);
    const totalAttended = buckets.reduce(
        (total, row) => total + row.onTime + row.late,
        0,
    );
    const hasData = buckets.some((row) => row.scheduled > 0);
    const series = [
        { key: 'onTimeRate', label: t('dashboard.attendance.onTime'), color: chartColors.ink },
        { key: 'lateRate', label: t('dashboard.attendance.late'), color: chartColors.accent },
    ] as const;

    const titleOf = (bucket: AttendanceBucket) =>
        weekly
            ? interpolate(t('dashboard.attendance.weekOf'), { date: bucket.label })
            : bucket.label;

    return (
        <DashboardCard
            action={
                <dl className="flex gap-6">
                    <div className="flex flex-col">
                        <dt className="text-xs text-muted">
                            {t('dashboard.attendance.avgOnTime')}
                        </dt>
                        <dd className="text-[22px] font-semibold tracking-[-0.02em] text-ink tabular-nums">
                            {totalAttended > 0
                                ? formatPercent(totalOnTime / totalAttended, language)
                                : '—'}
                        </dd>
                    </div>
                    <div className="flex flex-col">
                        <dt className="text-xs text-muted">
                            {t('dashboard.attendance.workedHours')}
                        </dt>
                        <dd className="text-[22px] font-semibold tracking-[-0.02em] text-ink tabular-nums">
                            {formatHours(workedMinutes, language)}
                        </dd>
                    </div>
                </dl>
            }
            className="flex-[1.4_1_520px]"
            description={
                weekly
                    ? t('dashboard.attendance.weeklyDescription')
                    : t('dashboard.attendance.dailyDescription')
            }
            table={
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-rule text-xs text-muted">
                            <th className="py-2 text-left font-medium">
                                {t('dashboard.common.date')}
                            </th>
                            <th className="py-2 text-right font-medium">
                                {t('dashboard.attendance.scheduled')}
                            </th>
                            <th className="py-2 text-right font-medium">
                                {t('dashboard.attendance.onTime')}
                            </th>
                            <th className="py-2 text-right font-medium">
                                {t('dashboard.attendance.late')}
                            </th>
                            <th className="py-2 text-right font-medium">
                                {t('dashboard.attendance.rate')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {buckets.map((row) => (
                            <tr className="border-b border-rule-soft text-ink" key={row.key}>
                                <td className="py-1.5">{titleOf(row)}</td>
                                <td className="py-1.5 text-right tabular-nums">{row.scheduled}</td>
                                <td className="py-1.5 text-right tabular-nums">{row.onTime}</td>
                                <td className="py-1.5 text-right tabular-nums">{row.late}</td>
                                <td className="py-1.5 text-right tabular-nums">
                                    {formatPercent(
                                        (row.onTimeRate + row.lateRate) / 100,
                                        language,
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            }
            title={interpolate(t('dashboard.attendance.title'), { days })}
        >
            {hasData ? (
                <div className="h-60">
                    <ResponsiveContainer height="100%" width="100%">
                        <BarChart
                            barCategoryGap={days > 7 ? '15%' : '30%'}
                            data={buckets}
                            margin={{ top: 4, right: 0, bottom: 0, left: -20 }}
                        >
                            <CartesianGrid
                                stroke={chartColors.grid}
                                strokeDasharray="0"
                                vertical={false}
                            />
                            <XAxis
                                axisLine={{ stroke: chartColors.grid }}
                                dataKey="label"
                                minTickGap={12}
                                tick={{
                                    fill: chartColors.axis,
                                    fontSize: 10,
                                }}
                                tickLine={false}
                            />
                            <YAxis
                                axisLine={false}
                                domain={[0, 100]}
                                tick={{ fill: chartColors.axis, fontSize: 11 }}
                                tickFormatter={(value: number) => `${value}%`}
                                tickLine={false}
                                ticks={[0, 50, 100]}
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    const row = payload?.[0]?.payload as
                                        | AttendanceBucket
                                        | undefined;

                                    if (!active || !row) return null;

                                    return (
                                        <ChartTooltip
                                            footer={[
                                                {
                                                    label: t('dashboard.attendance.scheduled'),
                                                    value: String(row.scheduled),
                                                },
                                            ]}
                                            rows={[
                                                {
                                                    color: chartColors.ink,
                                                    label: t('dashboard.attendance.onTime'),
                                                    value: String(row.onTime),
                                                },
                                                {
                                                    color: chartColors.accent,
                                                    label: t('dashboard.attendance.late'),
                                                    value: String(row.late),
                                                },
                                            ]}
                                            title={titleOf(row)}
                                        />
                                    );
                                }}
                                cursor={{ fill: 'rgba(23, 22, 15, 0.04)' }}
                            />
                            <Legend
                                content={() => (
                                    <ChartLegend
                                        items={series.map((item) => ({
                                            key: item.key,
                                            label: item.label,
                                            color: item.color,
                                        }))}
                                    />
                                )}
                            />
                            <Bar
                                dataKey="onTimeRate"
                                fill={chartColors.ink}
                                name={series[0].label}
                                stackId="attendance"
                            >
                                {buckets.map((row) => (
                                    <Cell
                                        fill={row.isCurrent ? chartColors.inkMuted : chartColors.ink}
                                        key={row.key}
                                    />
                                ))}
                            </Bar>
                            <Bar
                                dataKey="lateRate"
                                fill={chartColors.accent}
                                name={series[1].label}
                                radius={[3, 3, 0, 0]}
                                stackId="attendance"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <p className="py-16 text-center text-sm text-muted">
                    {t('dashboard.common.noChartData')}
                </p>
            )}
        </DashboardCard>
    );
}
