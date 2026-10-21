import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChartColumn,
    faClipboardCheck,
    faClock,
    faRotateRight,
    faUserCheck,
    faUserClock,
} from '@fortawesome/free-solid-svg-icons';
import {
    Button,
    DropdownSelect,
    LoadingOverlay,
    PageHeader,
} from '@/components/ui';
import { type I18nKey, useI18n } from '@/i18n';
import { getDashboardErrorKey, getDashboardSummary } from '../api/dashboard.api';
import { ActionItemsPanel } from '../components/ActionItemsPanel';
import { AttendanceTrendChart } from '../components/AttendanceTrendChart';
import { BranchHoursChart } from '../components/BranchHoursChart';
import { PayrollPeriodCard } from '../components/PayrollPeriodCard';
import { PayrollTrendChart } from '../components/PayrollTrendChart';
import { RankingList } from '../components/RankingList';
import { StatCard } from '../components/StatCard';
import { formatLongDate, formatTime, interpolate } from '../lib/format';
import { type DashboardRangeDays, type DashboardSummary } from '../types';

const allBranchesValue = 'all';
const rangeOptions: DashboardRangeDays[] = [7, 30, 90];

export function ManagerDashboard() {
    const { language, t } = useI18n();
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [branchId, setBranchId] = useState(allBranchesValue);
    const [days, setDays] = useState<DashboardRangeDays>(7);
    const [loading, setLoading] = useState(true);
    const [errorKey, setErrorKey] = useState<I18nKey | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let cancelled = false;

        getDashboardSummary({
            days,
            branchId: branchId === allBranchesValue ? undefined : branchId,
        })
            .then((data) => {
                if (cancelled) return;
                setSummary(data);
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
    }, [branchId, days, reloadKey]);

    function reload() {
        setLoading(true);
        setReloadKey((current) => current + 1);
    }

    function changeBranch(value: string) {
        setLoading(true);
        setBranchId(value);
    }

    function changeDays(value: DashboardRangeDays) {
        if (value === days) return;
        setLoading(true);
        setDays(value);
    }

    const today = summary?.todayStats;
    const attended = today ? today.onTime + today.late : 0;

    return (
        <section className="mx-auto grid max-w-[1440px] gap-5 p-6 max-sm:p-4">
            <PageHeader
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        <DropdownSelect
                            ariaLabel={t('common.branch')}
                            className="min-w-48 max-sm:w-full"
                            options={[
                                { value: allBranchesValue, label: t('common.allBranches') },
                                ...(summary?.branches ?? []).map((branch) => ({
                                    value: branch.id,
                                    label: branch.name,
                                })),
                            ]}
                            value={branchId}
                            onChange={changeBranch}
                        />
                        <div
                            aria-label={t('dashboard.range.label')}
                            className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5"
                            role="group"
                        >
                            {rangeOptions.map((option) => (
                                <button
                                    aria-pressed={days === option}
                                    className={`min-h-9 cursor-pointer rounded-md px-3 text-sm font-semibold transition ${
                                        days === option
                                            ? 'bg-white text-primary-700 shadow-sm'
                                            : 'bg-transparent text-slate-500 hover:text-slate-800'
                                    }`}
                                    key={option}
                                    type="button"
                                    onClick={() => changeDays(option)}
                                >
                                    {interpolate(t('dashboard.range.days'), { days: option })}
                                </button>
                            ))}
                        </div>
                        <Button
                            onClick={reload}
                            size="lg"
                            variant="secondary"
                        >
                            <FontAwesomeIcon icon={faRotateRight} />
                            {t('common.refresh')}
                        </Button>
                    </div>
                }
                description={
                    summary
                    ? `${formatLongDate(summary.date, language)} · ${interpolate(
                    t('dashboard.updatedAt'),
                    { time: formatTime(summary.generatedAt, language) },
                    )}`
                    : t('dashboard.subtitle')
                }
                icon={<FontAwesomeIcon icon={faChartColumn} />}
                title={t('dashboard.title')}
            />

            {errorKey && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {t(errorKey)}
                </div>
            )}

            <div className={`relative grid gap-5 ${summary ? '' : 'min-h-64'}`}>
                <LoadingOverlay label={t('dashboard.loading')} visible={loading} />

                {summary && today && (
                    <>
                        <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1">
                            <StatCard
                                hint={interpolate(t('dashboard.kpi.shiftsHint'), {
                                    notRecorded: today.notRecorded,
                                    onLeave: today.onLeave,
                                })}
                                icon={faUserCheck}
                                label={t('dashboard.kpi.shiftsToday')}
                                value={`${attended}/${today.scheduled}`}
                            />
                            <StatCard
                                icon={faClock}
                                label={t('dashboard.kpi.working')}
                                tone="success"
                                value={today.working}
                            />
                            <StatCard
                                hint={interpolate(t('dashboard.kpi.absentHint'), {
                                    absent: today.absent,
                                })}
                                icon={faUserClock}
                                label={t('dashboard.kpi.late')}
                                tone={today.late > 0 ? 'warning' : 'neutral'}
                                value={today.late}
                            />
                            <StatCard
                                hint={interpolate(t('dashboard.kpi.pendingHint'), {
                                    leave: summary.pending.leaveRequests,
                                    shift: summary.pending.shiftRequests,
                                    attendance: summary.pending.attendanceConfirmations,
                                })}
                                icon={faClipboardCheck}
                                label={t('dashboard.kpi.pending')}
                                tone={summary.pending.total > 0 ? 'danger' : 'neutral'}
                                value={summary.pending.total}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-5 max-xl:grid-cols-1">
                            <ActionItemsPanel summary={summary} />
                            <PayrollPeriodCard
                                holidays={summary.upcomingHolidays}
                                period={summary.currentPayrollPeriod}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-5 max-xl:grid-cols-1">
                            <AttendanceTrendChart data={summary.attendanceTrend} />
                            <div className="grid content-start gap-5">
                                <RankingList
                                    countLabel={t('dashboard.ranking.lateCount')}
                                    description={interpolate(
                                        t('dashboard.ranking.rangeDescription'),
                                        { days: summary.range.days },
                                    )}
                                    items={summary.topLateEmployees}
                                    metric="minutes"
                                    title={t('dashboard.ranking.lateTitle')}
                                />
                                <RankingList
                                    countLabel={t('dashboard.ranking.overtimeCount')}
                                    description={interpolate(
                                        t('dashboard.ranking.rangeDescription'),
                                        { days: summary.range.days },
                                    )}
                                    items={summary.topOvertimeEmployees}
                                    metric="hours"
                                    title={t('dashboard.ranking.overtimeTitle')}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-5 max-xl:grid-cols-1">
                            <div className="xl:col-span-2">
                                <PayrollTrendChart data={summary.payrollTrend} />
                            </div>
                            <BranchHoursChart data={summary.branchHours} />
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}
