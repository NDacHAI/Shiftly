import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { type I18nKey, useI18n } from '@/i18n';
import { chartColors } from '../lib/chart-colors';
import { formatShortDate } from '../lib/format';
import { type DashboardDailyStats } from '../types';
import { ChartLegend } from './ChartLegend';
import { ChartTooltip } from './ChartTooltip';
import { DashboardCard } from './DashboardCard';

type AttendanceSeriesKey = 'onTime' | 'late' | 'absent' | 'onLeave' | 'notRecorded';

// Bottom-to-top stacking order; colors carry state and every series is labeled in the legend.
const series: Array<{ key: AttendanceSeriesKey; labelKey: I18nKey; color: string }> = [
    { key: 'onTime', labelKey: 'dashboard.attendance.onTime', color: chartColors.good },
    { key: 'late', labelKey: 'dashboard.attendance.late', color: chartColors.warning },
    { key: 'absent', labelKey: 'dashboard.attendance.absent', color: chartColors.critical },
    { key: 'onLeave', labelKey: 'dashboard.attendance.onLeave', color: chartColors.series1 },
    { key: 'notRecorded', labelKey: 'dashboard.attendance.notRecorded', color: chartColors.neutral },
];

type AttendanceTrendChartProps = {
    data: DashboardDailyStats[];
};

export function AttendanceTrendChart({ data }: AttendanceTrendChartProps) {
    const { language, t } = useI18n();
    const rows = data.map((row) => ({
        ...row,
        label: formatShortDate(row.date, language),
    }));
    const hasData = data.some((row) => row.scheduled > 0);

    return (
        <DashboardCard
            className="xl:col-span-2"
            description={t('dashboard.attendance.description')}
            table={
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-200 text-xs text-slate-500">
                            <th className="py-2 text-left font-semibold">
                                {t('dashboard.common.date')}
                            </th>
                            <th className="py-2 text-right font-semibold">
                                {t('dashboard.attendance.scheduled')}
                            </th>
                            {series.map((item) => (
                                <th
                                    className="py-2 text-right font-semibold"
                                    key={item.key}
                                >
                                    {t(item.labelKey)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr className="border-b border-slate-100" key={row.date}>
                                <td className="py-1.5 text-slate-700">{row.label}</td>
                                <td className="py-1.5 text-right tabular-nums">
                                    {row.scheduled}
                                </td>
                                {series.map((item) => (
                                    <td
                                        className="py-1.5 text-right tabular-nums"
                                        key={item.key}
                                    >
                                        {row[item.key]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            }
            title={t('dashboard.attendance.title')}
        >
            {hasData ? (
                <div className="h-72">
                    <ResponsiveContainer height="100%" width="100%">
                        <BarChart
                            barCategoryGap="20%"
                            data={rows}
                            margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
                        >
                            <CartesianGrid
                                stroke={chartColors.grid}
                                strokeDasharray="0"
                                vertical={false}
                            />
                            <XAxis
                                axisLine={{ stroke: chartColors.neutral }}
                                dataKey="label"
                                minTickGap={12}
                                tick={{ fill: chartColors.axis, fontSize: 12 }}
                                tickLine={false}
                            />
                            <YAxis
                                allowDecimals={false}
                                axisLine={false}
                                tick={{ fill: chartColors.axis, fontSize: 12 }}
                                tickLine={false}
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    const row = payload?.[0]?.payload as
                                        | (typeof rows)[number]
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
                                            rows={[...series].reverse().map((item) => ({
                                                color: item.color,
                                                label: t(item.labelKey),
                                                value: String(row[item.key]),
                                            }))}
                                            title={row.label}
                                        />
                                    );
                                }}
                                cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }}
                            />
                            <Legend
                                content={() => (
                                    <ChartLegend
                                        items={series.map((item) => ({
                                            key: item.key,
                                            label: t(item.labelKey),
                                            color: item.color,
                                        }))}
                                    />
                                )}
                            />
                            {series.map((item, index) => (
                                <Bar
                                    dataKey={item.key}
                                    fill={item.color}
                                    key={item.key}
                                    maxBarSize={28}
                                    name={t(item.labelKey)}
                                    radius={
                                        index === series.length - 1
                                            ? [4, 4, 0, 0]
                                            : 0
                                    }
                                    stackId="attendance"
                                    stroke={chartColors.surface}
                                    strokeWidth={1}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <p className="py-16 text-center text-sm text-slate-500">
                    {t('dashboard.common.noChartData')}
                </p>
            )}
        </DashboardCard>
    );
}
