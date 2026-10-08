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
import { formatCompactMoney, formatMoney } from '../lib/format';
import { type DashboardPayrollTrend } from '../types';
import { ChartLegend } from './ChartLegend';
import { ChartTooltip } from './ChartTooltip';
import { DashboardCard } from './DashboardCard';

type PayrollSeriesKey = 'regularPay' | 'overtimePay' | 'holidayPay' | 'rewardTotal';

const series: Array<{ key: PayrollSeriesKey; labelKey: I18nKey; color: string }> = [
    { key: 'regularPay', labelKey: 'dashboard.payroll.regularPay', color: chartColors.series1 },
    { key: 'overtimePay', labelKey: 'dashboard.payroll.overtimePay', color: chartColors.series2 },
    { key: 'holidayPay', labelKey: 'dashboard.payroll.holidayPay', color: chartColors.series3 },
    { key: 'rewardTotal', labelKey: 'dashboard.payroll.rewardTotal', color: chartColors.series4 },
];

type PayrollTrendChartProps = {
    data: DashboardPayrollTrend[];
};

export function PayrollTrendChart({ data }: PayrollTrendChartProps) {
    const { language, t } = useI18n();
    const rows = data.map((row) => ({
        ...row,
        label: `${String(row.month).padStart(2, '0')}/${row.year}`,
    }));

    return (
        <DashboardCard
            description={t('dashboard.payroll.description')}
            table={
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-200 text-xs text-slate-500">
                            <th className="py-2 text-left font-semibold">
                                {t('dashboard.payroll.period')}
                            </th>
                            {series.map((item) => (
                                <th className="py-2 text-right font-semibold" key={item.key}>
                                    {t(item.labelKey)}
                                </th>
                            ))}
                            <th className="py-2 text-right font-semibold">
                                {t('dashboard.payroll.penaltyTotal')}
                            </th>
                            <th className="py-2 text-right font-semibold">
                                {t('dashboard.payroll.netPay')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr className="border-b border-slate-100" key={row.payrollPeriodId}>
                                <td className="py-1.5 text-slate-700">{row.label}</td>
                                {series.map((item) => (
                                    <td className="py-1.5 text-right tabular-nums" key={item.key}>
                                        {formatMoney(row[item.key], language)}
                                    </td>
                                ))}
                                <td className="py-1.5 text-right tabular-nums">
                                    {formatMoney(row.penaltyTotal, language)}
                                </td>
                                <td className="py-1.5 text-right font-semibold tabular-nums">
                                    {formatMoney(row.netPay, language)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            }
            title={t('dashboard.payroll.title')}
        >
            {rows.length > 0 ? (
                <div className="h-72">
                    <ResponsiveContainer height="100%" width="100%">
                        <BarChart
                            barCategoryGap="30%"
                            data={rows}
                            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                        >
                            <CartesianGrid stroke={chartColors.grid} vertical={false} />
                            <XAxis
                                axisLine={{ stroke: chartColors.neutral }}
                                dataKey="label"
                                tick={{ fill: chartColors.axis, fontSize: 12 }}
                                tickLine={false}
                            />
                            <YAxis
                                axisLine={false}
                                tick={{ fill: chartColors.axis, fontSize: 12 }}
                                tickFormatter={(value: number) =>
                                    formatCompactMoney(value, language)
                                }
                                tickLine={false}
                                width={56}
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
                                                    label: t('dashboard.payroll.penaltyTotal'),
                                                    value: `-${formatMoney(row.penaltyTotal, language)}`,
                                                },
                                                {
                                                    label: t('dashboard.payroll.netPay'),
                                                    value: formatMoney(row.netPay, language),
                                                },
                                            ]}
                                            rows={[...series].reverse().map((item) => ({
                                                color: item.color,
                                                label: t(item.labelKey),
                                                value: formatMoney(row[item.key], language),
                                            }))}
                                            title={row.name}
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
                                    maxBarSize={40}
                                    name={t(item.labelKey)}
                                    radius={
                                        index === series.length - 1
                                            ? [4, 4, 0, 0]
                                            : 0
                                    }
                                    stackId="payroll"
                                    stroke={chartColors.surface}
                                    strokeWidth={1}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <p className="py-16 text-center text-sm text-slate-500">
                    {t('dashboard.payroll.empty')}
                </p>
            )}
        </DashboardCard>
    );
}
