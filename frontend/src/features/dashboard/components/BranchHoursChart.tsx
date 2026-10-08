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
import { useI18n } from '@/i18n';
import { chartColors } from '../lib/chart-colors';
import { formatNumber, minutesToHours } from '../lib/format';
import { type DashboardBranchHours } from '../types';
import { ChartLegend } from './ChartLegend';
import { ChartTooltip } from './ChartTooltip';
import { DashboardCard } from './DashboardCard';

type BranchHoursChartProps = {
    data: DashboardBranchHours[];
};

export function BranchHoursChart({ data }: BranchHoursChartProps) {
    const { language, t } = useI18n();
    // workedMinutes already includes overtime, so split it into two non-overlapping parts.
    const rows = data.map((row) => ({
        branchName: row.branchName,
        regularHours: minutesToHours(
            Math.max(0, row.workedMinutes - row.overtimeMinutes),
        ),
        overtimeHours: minutesToHours(row.overtimeMinutes),
        totalHours: minutesToHours(row.workedMinutes),
    }));
    const hoursUnit = t('dashboard.common.hoursUnit');
    const chartHeight = Math.max(160, rows.length * 44 + 60);

    return (
        <DashboardCard
            description={t('dashboard.branchHours.description')}
            table={
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-200 text-xs text-slate-500">
                            <th className="py-2 text-left font-semibold">
                                {t('common.branch')}
                            </th>
                            <th className="py-2 text-right font-semibold">
                                {t('dashboard.branchHours.regular')}
                            </th>
                            <th className="py-2 text-right font-semibold">
                                {t('dashboard.branchHours.overtime')}
                            </th>
                            <th className="py-2 text-right font-semibold">
                                {t('dashboard.common.total')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr className="border-b border-slate-100" key={row.branchName}>
                                <td className="py-1.5 text-slate-700">{row.branchName}</td>
                                <td className="py-1.5 text-right tabular-nums">
                                    {formatNumber(row.regularHours, language)}
                                </td>
                                <td className="py-1.5 text-right tabular-nums">
                                    {formatNumber(row.overtimeHours, language)}
                                </td>
                                <td className="py-1.5 text-right font-semibold tabular-nums">
                                    {formatNumber(row.totalHours, language)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            }
            title={t('dashboard.branchHours.title')}
        >
            {rows.some((row) => row.totalHours > 0) ? (
                <div style={{ height: chartHeight }}>
                    <ResponsiveContainer height="100%" width="100%">
                        <BarChart
                            barCategoryGap="30%"
                            data={rows}
                            layout="vertical"
                            margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
                        >
                            <CartesianGrid
                                horizontal={false}
                                stroke={chartColors.grid}
                            />
                            <XAxis
                                axisLine={false}
                                tick={{ fill: chartColors.axis, fontSize: 12 }}
                                tickLine={false}
                                type="number"
                            />
                            <YAxis
                                axisLine={{ stroke: chartColors.neutral }}
                                dataKey="branchName"
                                tick={{ fill: '#475569', fontSize: 12 }}
                                tickLine={false}
                                type="category"
                                width={110}
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
                                                    label: t('dashboard.common.total'),
                                                    value: `${formatNumber(row.totalHours, language)} ${hoursUnit}`,
                                                },
                                            ]}
                                            rows={[
                                                {
                                                    color: chartColors.series1,
                                                    label: t('dashboard.branchHours.regular'),
                                                    value: `${formatNumber(row.regularHours, language)} ${hoursUnit}`,
                                                },
                                                {
                                                    color: chartColors.series2,
                                                    label: t('dashboard.branchHours.overtime'),
                                                    value: `${formatNumber(row.overtimeHours, language)} ${hoursUnit}`,
                                                },
                                            ]}
                                            title={row.branchName}
                                        />
                                    );
                                }}
                                cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }}
                            />
                            <Legend
                                content={() => (
                                    <ChartLegend
                                        items={[
                                            {
                                                key: 'regular',
                                                label: t('dashboard.branchHours.regular'),
                                                color: chartColors.series1,
                                            },
                                            {
                                                key: 'overtime',
                                                label: t('dashboard.branchHours.overtime'),
                                                color: chartColors.series2,
                                            },
                                        ]}
                                    />
                                )}
                            />
                            <Bar
                                dataKey="regularHours"
                                fill={chartColors.series1}
                                maxBarSize={22}
                                name={t('dashboard.branchHours.regular')}
                                stackId="hours"
                                stroke={chartColors.surface}
                                strokeWidth={1}
                            />
                            <Bar
                                dataKey="overtimeHours"
                                fill={chartColors.series2}
                                maxBarSize={22}
                                name={t('dashboard.branchHours.overtime')}
                                radius={[0, 4, 4, 0]}
                                stackId="hours"
                                stroke={chartColors.surface}
                                strokeWidth={1}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <p className="py-12 text-center text-sm text-slate-500">
                    {t('dashboard.common.noChartData')}
                </p>
            )}
        </DashboardCard>
    );
}
