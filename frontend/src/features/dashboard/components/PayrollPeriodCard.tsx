import { Link } from 'react-router-dom';
import { faCalendarCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { routes } from '@/constants/routes';
import { type I18nKey, useI18n } from '@/i18n';
import { formatShortDate, interpolate } from '../lib/format';
import {
    type DashboardCurrentPayrollPeriod,
    type DashboardHoliday,
} from '../types';
import { DashboardCard } from './DashboardCard';

type PayrollPeriodCardProps = {
    period: DashboardCurrentPayrollPeriod | null;
    holidays: DashboardHoliday[];
};

const processingStatusKeys: Record<
    NonNullable<DashboardCurrentPayrollPeriod['processingStatus']>,
    I18nKey
> = {
    DRAFT: 'dashboard.payrollPeriod.processing.draft',
    PROCESSING: 'dashboard.payrollPeriod.processing.processing',
    COMPLETED: 'dashboard.payrollPeriod.processing.completed',
    FAILED: 'dashboard.payrollPeriod.processing.failed',
    CLOSED: 'dashboard.payrollPeriod.processing.closed',
};

export function PayrollPeriodCard({ period, holidays }: PayrollPeriodCardProps) {
    const { language, t } = useI18n();

    function daysRemainingText(days: number) {
        if (days < 0) {
            return interpolate(t('dashboard.payrollPeriod.overdue'), {
                days: Math.abs(days),
            });
        }

        if (days === 0) {
            return t('dashboard.payrollPeriod.endsToday');
        }

        return interpolate(t('dashboard.payrollPeriod.daysRemaining'), { days });
    }

    return (
        <DashboardCard title={t('dashboard.payrollPeriod.title')}>
            {period ? (
                <div className="grid gap-3">
                    <div>
                        <Link
                            className="text-sm font-semibold text-slate-900 hover:text-primary-600"
                            to={routes.payrollPeriods}
                        >
                            {period.name}
                        </Link>
                        <p className="text-xs text-slate-500">
                            {formatShortDate(period.startDate, language)} -{' '}
                            {formatShortDate(period.endDate, language)}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                        <span
                            className={`rounded-full px-2.5 py-1 ${
                                period.daysRemaining < 0
                                    ? 'bg-red-50 text-red-700'
                                    : 'bg-primary-50 text-primary-700'
                            }`}
                        >
                            {daysRemainingText(period.daysRemaining)}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                            {period.processingStatus
                                ? t(processingStatusKeys[period.processingStatus])
                                : t('dashboard.payrollPeriod.notGenerated')}
                        </span>
                    </div>
                </div>
            ) : (
                <p className="text-sm text-slate-500">
                    {t('dashboard.payrollPeriod.empty')}
                </p>
            )}

            <div className="mt-5 border-t border-slate-100 pt-4">
                <h4 className="mb-2 text-sm font-semibold text-slate-800">
                    {t('dashboard.holidays.title')}
                </h4>
                {holidays.length === 0 ? (
                    <p className="text-sm text-slate-500">
                        {t('dashboard.holidays.empty')}
                    </p>
                ) : (
                    <ul className="grid gap-2">
                        {holidays.map((holiday) => (
                            <li
                                className="flex items-center gap-3 text-sm"
                                key={holiday.id}
                            >
                                <FontAwesomeIcon
                                    className="text-primary-500"
                                    icon={faCalendarCheck}
                                />
                                <span className="flex-1 truncate text-slate-700">
                                    {holiday.name}
                                </span>
                                <span className="text-xs font-semibold text-slate-500">
                                    {formatShortDate(holiday.holidayDate, language)}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </DashboardCard>
    );
}
