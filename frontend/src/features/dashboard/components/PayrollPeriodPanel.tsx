import { Link } from 'react-router-dom';
import { routes } from '@/constants/routes';
import { useI18n } from '@/i18n';
import {
    formatMoney,
    formatPercent,
    formatShortDate,
    interpolate,
} from '../lib/format';
import {
    type DashboardCurrentPayrollPeriod,
    type DashboardPayrollTrend,
} from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;

function dayNumber(date: string) {
    const [year, month, day] = date.split('-').map(Number);

    return Date.UTC(year, month - 1, day) / DAY_MS;
}

// Where the open period sits in the attendance -> calculate -> review -> closed flow.
function stepIndexOf(status: DashboardCurrentPayrollPeriod['processingStatus']) {
    switch (status) {
        case 'PROCESSING':
        case 'FAILED':
            return 1;
        case 'COMPLETED':
            return 2;
        case 'CLOSED':
            return 3;
        default:
            return 0;
    }
}

type PayrollPeriodPanelProps = {
    period: DashboardCurrentPayrollPeriod | null;
    trend: DashboardPayrollTrend[];
    date: string;
};

export function PayrollPeriodPanel({ period, trend, date }: PayrollPeriodPanelProps) {
    const { language, t } = useI18n();
    const latest = trend[trend.length - 1];
    const previous = trend[trend.length - 2];
    const change =
        latest && previous && previous.grossPay > 0
            ? (latest.grossPay - previous.grossPay) / previous.grossPay
            : null;

    const totalDays = period
        ? dayNumber(period.endDate) - dayNumber(period.startDate) + 1
        : 0;
    const elapsedDays = period
        ? Math.min(Math.max(dayNumber(date) - dayNumber(period.startDate) + 1, 0), totalDays)
        : 0;
    const stepIndex = stepIndexOf(period?.processingStatus ?? null);
    const steps = [
        t('dashboard.payroll.steps.attendance'),
        t('dashboard.payroll.steps.calculate'),
        t('dashboard.payroll.steps.review'),
        t('dashboard.payroll.steps.closed'),
    ];

    function closingText(days: number) {
        if (days < 0) {
            return interpolate(t('dashboard.payroll.overdue'), { days: Math.abs(days) });
        }

        if (days === 0) {
            return t('dashboard.payroll.closesToday');
        }

        return interpolate(t('dashboard.payroll.closesIn'), { days });
    }

    return (
        <section className="flex flex-[1_1_360px] flex-col gap-5 rounded-[14px] bg-ink px-6 py-[22px] text-sand max-sm:px-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-[17px] font-semibold tracking-[-0.01em]">
                    {period?.name ?? t('dashboard.payroll.title')}
                </h2>
                {period && (
                    <span className="font-mono text-xs text-fog">
                        {formatShortDate(period.startDate, language)} –{' '}
                        {formatShortDate(period.endDate, language)}
                    </span>
                )}
            </div>

            {latest ? (
                <div className="flex flex-col gap-1">
                    <span className="text-[13px] text-fog">
                        {interpolate(t('dashboard.payroll.latestTotal'), { name: latest.name })}
                    </span>
                    <span className="text-4xl leading-[1.1] font-semibold tracking-[-0.04em] tabular-nums max-sm:text-3xl">
                        {formatMoney(latest.grossPay, language)}{' '}
                        <span className="text-lg text-fog">₫</span>
                    </span>
                    <span className="text-[13px] text-fog">
                        {[
                            change !== null && previous
                                ? interpolate(t('dashboard.payroll.change'), {
                                      change: `${change >= 0 ? '+' : ''}${formatPercent(change, language)}`,
                                      name: previous.name,
                                  })
                                : '',
                            interpolate(t('dashboard.payroll.employees'), {
                                count: latest.employees,
                            }),
                        ]
                            .filter(Boolean)
                            .join(' · ')}
                    </span>
                </div>
            ) : (
                <p className="text-[13px] text-fog">{t('dashboard.payroll.noPayroll')}</p>
            )}

            {period ? (
                <>
                    <div className="flex flex-col gap-2.5">
                        <div className="flex justify-between gap-3 text-[13px]">
                            <span>{closingText(period.daysRemaining)}</span>
                            <span className="font-mono text-fog">
                                {elapsedDays}/{totalDays}
                            </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-[3px] bg-ink-soft">
                            <div
                                className="h-full bg-ember"
                                style={{
                                    width: `${totalDays > 0 ? (elapsedDays / totalDays) * 100 : 0}%`,
                                }}
                            />
                        </div>
                    </div>

                    <ol className="mt-auto grid grid-cols-4 gap-1.5">
                        {steps.map((label, index) => (
                            <li className="flex flex-col gap-2" key={label}>
                                <div
                                    className={`h-[3px] rounded-sm ${
                                        index <= stepIndex ? 'bg-ember' : 'bg-ink-line'
                                    }`}
                                />
                                <span
                                    className={`text-xs ${
                                        index <= stepIndex ? 'text-sand' : 'text-faint'
                                    }`}
                                >
                                    {label}
                                </span>
                            </li>
                        ))}
                    </ol>

                    {period.processingStatus === 'FAILED' && (
                        <p className="text-xs text-ember">{t('dashboard.payroll.failed')}</p>
                    )}
                </>
            ) : (
                <p className="mt-auto text-[13px] text-fog">{t('dashboard.payroll.noPeriod')}</p>
            )}

            <Link
                className="grid h-[38px] place-items-center rounded-lg border border-ink-line text-[13px] font-medium text-sand no-underline hover:bg-[#26251d] hover:text-sand"
                to={routes.payrollProcessings}
            >
                {t('dashboard.payroll.open')}
            </Link>
        </section>
    );
}
