import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBusinessTime,
    faCalendarDay,
    faCalendarXmark,
    faChartColumn,
    faClock,
    faRotateRight,
    faUserClock,
} from '@fortawesome/free-solid-svg-icons';
import { useToast } from '@/components/feedback';
import { Button, EmptyState, LoadingOverlay } from '@/components/ui';
import { routes } from '@/constants/routes';
import { checkIn, checkOut, getAttendanceErrorKey } from '@/features/attendance/api/attendance.api';
import { type I18nKey, useI18n } from '@/i18n';
import { getDashboardErrorKey, getMyDashboard } from '../api/dashboard.api';
import { DashboardCard } from '../components/DashboardCard';
import { MyShiftList } from '../components/MyShiftList';
import { StatCard } from '../components/StatCard';
import {
    formatHours,
    formatLongDate,
    formatMoney,
    formatShortDate,
    interpolate,
} from '../lib/format';
import {
    type DashboardMine,
    type DashboardMyRequest,
    type DashboardMySchedule,
} from '../types';

const requestStatusKeys: Record<DashboardMyRequest['status'], I18nKey> = {
    PENDING: 'dashboard.requestStatus.pending',
    APPROVED: 'dashboard.requestStatus.approved',
    REJECTED: 'dashboard.requestStatus.rejected',
    CANCELLED: 'dashboard.requestStatus.cancelled',
    0: 'dashboard.requestStatus.pending',
    1: 'dashboard.requestStatus.approved',
    2: 'dashboard.requestStatus.rejected',
    3: 'dashboard.requestStatus.cancelled',
};

export function EmployeeDashboard() {
    const { language, t } = useI18n();
    const { showToast } = useToast();
    const [dashboard, setDashboard] = useState<DashboardMine | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorKey, setErrorKey] = useState<I18nKey | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let cancelled = false;

        getMyDashboard()
            .then((data) => {
                if (cancelled) return;
                setDashboard(data);
                setErrorKey(null);
            })
            .catch((loadError: unknown) => {
                if (!cancelled) setErrorKey(getDashboardErrorKey(loadError));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [reloadKey]);

    function reload() {
        setLoading(true);
        setReloadKey((current) => current + 1);
    }

    async function runAttendanceAction(
        schedule: DashboardMySchedule,
        action: () => Promise<unknown>,
        successKey: I18nKey,
    ) {
        setProcessingId(schedule.workScheduleId);

        try {
            await action();
            showToast({
                title: t('common.success'),
                message: t(successKey),
                variant: 'success',
            });
            reload();
        } catch (actionError) {
            showToast({
                title: t('attendance.actionError'),
                message: t(getAttendanceErrorKey(actionError)),
                variant: 'error',
            });
        } finally {
            setProcessingId(null);
        }
    }

    const month = dashboard?.monthStats;

    return (
        <section className="mx-auto grid max-w-[1440px] gap-5 p-6 max-sm:p-4">
            <div className="flex items-center justify-between gap-5 rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm max-lg:flex-col max-lg:items-stretch">
                <div className="flex items-center gap-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xl text-primary-600">
                        <FontAwesomeIcon icon={faChartColumn} />
                    </span>
                    <div>
                        <h2 className="text-xl font-bold text-slate-950">
                            {dashboard
                                ? interpolate(t('dashboard.my.greeting'), {
                                      name: dashboard.employee.fullName,
                                  })
                                : t('dashboard.title')}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {dashboard
                                ? formatLongDate(dashboard.date, language)
                                : t('dashboard.my.subtitle')}
                        </p>
                    </div>
                </div>
                <Button
                    className="max-sm:w-full"
                    onClick={reload}
                    size="lg"
                    variant="secondary"
                >
                    <FontAwesomeIcon icon={faRotateRight} />
                    {t('common.refresh')}
                </Button>
            </div>

            {errorKey && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {t(errorKey)}
                </div>
            )}

            <div className={`relative grid gap-5 ${dashboard ? '' : 'min-h-64'}`}>
                <LoadingOverlay label={t('dashboard.loading')} visible={loading} />

                {dashboard && month && (
                    <>
                        <DashboardCard
                            action={
                                <Link
                                    className="rounded-md px-2 py-1 text-xs font-semibold text-primary-600 hover:bg-primary-50"
                                    to={routes.attendance}
                                >
                                    {t('dashboard.common.viewAll')}
                                </Link>
                            }
                            description={t('dashboard.my.todayDescription')}
                            title={t('dashboard.my.todayTitle')}
                        >
                            {dashboard.todaySchedules.length === 0 ? (
                                <EmptyState
                                    description={t('dashboard.my.noShiftTodayDescription')}
                                    icon={<FontAwesomeIcon icon={faCalendarDay} />}
                                    title={t('dashboard.my.noShiftToday')}
                                />
                            ) : (
                                <MyShiftList
                                    processingId={processingId}
                                    schedules={dashboard.todaySchedules}
                                    onCheckIn={(schedule) =>
                                        void runAttendanceAction(
                                            schedule,
                                            () => checkIn(schedule.workScheduleId),
                                            'attendance.checkedIn',
                                        )
                                    }
                                    onCheckOut={(schedule) =>
                                        schedule.attendanceId &&
                                        void runAttendanceAction(
                                            schedule,
                                            () => checkOut(schedule.attendanceId!),
                                            'attendance.checkedOut',
                                        )
                                    }
                                />
                            )}
                        </DashboardCard>

                        <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1">
                            <StatCard
                                hint={interpolate(t('dashboard.my.shiftsHint'), {
                                    scheduled: month.scheduledShifts,
                                })}
                                icon={faCalendarDay}
                                label={t('dashboard.my.attendedShifts')}
                                value={month.attendedShifts}
                            />
                            <StatCard
                                icon={faClock}
                                label={t('dashboard.my.workedHours')}
                                tone="success"
                                value={formatHours(month.workedMinutes, language)}
                            />
                            <StatCard
                                icon={faBusinessTime}
                                label={t('dashboard.my.overtimeHours')}
                                tone="primary"
                                value={formatHours(month.overtimeMinutes, language)}
                            />
                            <StatCard
                                hint={interpolate(t('dashboard.my.lateHint'), {
                                    minutes: month.lateMinutes,
                                    absent: month.absentCount,
                                })}
                                icon={faUserClock}
                                label={t('dashboard.my.lateCount')}
                                tone={month.lateCount > 0 ? 'warning' : 'neutral'}
                                value={month.lateCount}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-5 max-xl:grid-cols-1">
                            <DashboardCard
                                className="xl:col-span-2"
                                description={t('dashboard.my.upcomingDescription')}
                                title={t('dashboard.my.upcomingTitle')}
                            >
                                {dashboard.upcomingSchedules.length === 0 ? (
                                    <EmptyState
                                        icon={<FontAwesomeIcon icon={faCalendarXmark} />}
                                        title={t('dashboard.my.noUpcoming')}
                                    />
                                ) : (
                                    <MyShiftList
                                        schedules={dashboard.upcomingSchedules}
                                        showDate
                                    />
                                )}
                            </DashboardCard>

                            <div className="grid content-start gap-5">
                                <DashboardCard title={t('dashboard.my.payslipTitle')}>
                                    {dashboard.latestPayslip ? (
                                        <div>
                                            <p className="text-sm text-slate-500">
                                                {dashboard.latestPayslip.payrollPeriodName}
                                            </p>
                                            <p className="mt-1 text-2xl font-bold text-slate-950">
                                                {formatMoney(dashboard.latestPayslip.netPay, language)}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {interpolate(t('dashboard.my.grossPay'), {
                                                    amount: formatMoney(
                                                        dashboard.latestPayslip.grossPay,
                                                        language,
                                                    ),
                                                })}
                                            </p>
                                            <Link
                                                className="mt-3 inline-block text-xs font-semibold text-primary-600 hover:underline"
                                                to={routes.payslips}
                                            >
                                                {t('dashboard.common.viewAll')}
                                            </Link>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-500">
                                            {t('dashboard.my.noPayslip')}
                                        </p>
                                    )}
                                </DashboardCard>

                                <DashboardCard
                                    description={interpolate(t('dashboard.my.pendingRequests'), {
                                        leave: dashboard.pendingRequests.leaveRequests,
                                        shift: dashboard.pendingRequests.shiftRequests,
                                    })}
                                    title={t('dashboard.my.requestsTitle')}
                                >
                                    {dashboard.recentRequests.length === 0 ? (
                                        <p className="text-sm text-slate-500">
                                            {t('dashboard.my.noRequests')}
                                        </p>
                                    ) : (
                                        <ul className="grid gap-2">
                                            {dashboard.recentRequests.map((request) => (
                                                <li
                                                    className="flex items-center justify-between gap-3 text-sm"
                                                    key={`${request.type}-${request.id}`}
                                                >
                                                    <Link
                                                        className="min-w-0 truncate text-slate-700 hover:text-primary-600"
                                                        to={
                                                            request.type === 'LEAVE'
                                                                ? routes.leaveRequests
                                                                : routes.shiftRequests
                                                        }
                                                    >
                                                        {request.type === 'LEAVE'
                                                            ? t('dashboard.my.leaveRequest')
                                                            : t('dashboard.my.shiftRequest')}
                                                        {' · '}
                                                        {request.label}
                                                        {request.date &&
                                                            ` · ${formatShortDate(request.date, language)}`}
                                                    </Link>
                                                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                                                        {t(requestStatusKeys[request.status])}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </DashboardCard>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}
