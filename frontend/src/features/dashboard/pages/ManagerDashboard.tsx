import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateRight } from '@fortawesome/free-solid-svg-icons';
import { DropdownSelect } from '@/components/ui';
import { type I18nKey, useI18n } from '@/i18n';
import { getDashboardErrorKey, getDashboardSummary } from '../api/dashboard.api';
import { ApprovalQueue } from '../components/ApprovalQueue';
import { AttendanceTrendChart } from '../components/AttendanceTrendChart';
import { BranchStatsTable } from '../components/BranchStatsTable';
import { LiveTodayPanel } from '../components/LiveTodayPanel';
import { PayrollPeriodPanel } from '../components/PayrollPeriodPanel';
import { TodayShiftTimeline } from '../components/TodayShiftTimeline';
import { formatClockDate, hoursSinceDayStart, interpolate } from '../lib/format';
import { type DashboardRangeDays, type DashboardSummary } from '../types';

const allBranchesValue = 'all';
const rangeOptions: DashboardRangeDays[] = [7, 30, 90];

function greetingKeyOf(hour: number): I18nKey {
    if (hour < 12) return 'dashboard.greeting.morning';
    if (hour < 18) return 'dashboard.greeting.afternoon';
    return 'dashboard.greeting.evening';
}

type ManagerDashboardProps = {
    userName: string;
};

export function ManagerDashboard({ userName }: ManagerDashboardProps) {
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

    const greeting = interpolate(
        t(
            greetingKeyOf(
                summary ? hoursSinceDayStart(summary.generatedAt, summary.date) : 9,
            ),
        ),
        { name: userName },
    );
    const headline = summary
        ? interpolate(
              t(
                  summary.missingCheckInTotal > 0
                      ? 'dashboard.headline.attention'
                      : 'dashboard.headline.clear',
              ),
              {
                  missing: summary.missingCheckInTotal,
                  pending: summary.pending.total,
              },
          )
        : t('dashboard.subtitle');
    const workedMinutes =
        summary?.branchStats.reduce((total, row) => total + row.workedMinutes, 0) ?? 0;

    return (
        <section className="bg-sand text-ink">
            <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5 p-8 max-sm:p-4">
                <div className="flex flex-wrap items-end justify-between gap-5">
                    <div className="flex flex-col gap-1.5">
                        {summary && (
                            <span className="tabular-nums text-xs tracking-[0.04em] text-muted uppercase">
                                {formatClockDate(summary.generatedAt, language)}
                            </span>
                        )}
                        <h1 className="text-[34px] leading-tight font-semibold tracking-[-0.03em] text-pretty max-sm:text-[28px]">
                            {greeting}
                        </h1>
                        <p className="text-[15px] text-muted">{headline}</p>
                    </div>

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
                            className="flex gap-0.5 rounded-lg bg-stone p-[3px]"
                            role="group"
                        >
                            {rangeOptions.map((option) => (
                                <button
                                    aria-pressed={days === option}
                                    className={`h-8 min-h-0 cursor-pointer rounded-md border-0 px-3 text-[13px] font-medium ${
                                        days === option
                                            ? 'bg-paper text-ink shadow-[0_1px_2px_rgba(23,22,15,0.12)]'
                                            : 'bg-transparent text-muted hover:text-ink'
                                    }`}
                                    key={option}
                                    type="button"
                                    onClick={() => changeDays(option)}
                                >
                                    {interpolate(t('dashboard.range.days'), { days: option })}
                                </button>
                            ))}
                        </div>
                        <button
                            className="flex h-[38px] min-h-0 cursor-pointer items-center gap-2 rounded-lg border-0 bg-ink px-3.5 text-[13px] font-medium text-sand hover:bg-ink-soft disabled:cursor-wait disabled:opacity-70"
                            disabled={loading}
                            type="button"
                            onClick={reload}
                        >
                            <FontAwesomeIcon icon={faRotateRight} spin={loading} />
                            {t('common.refresh')}
                        </button>
                    </div>
                </div>

                {errorKey && (
                    <div className="rounded-[10px] border border-ember bg-ember-tint px-4 py-3 text-sm text-ember-ink">
                        {t(errorKey)}
                    </div>
                )}

                {!summary && loading && (
                    <div
                        aria-busy="true"
                        aria-label={t('dashboard.loading')}
                        className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-5"
                    >
                        <div className="col-span-full h-[132px] animate-pulse rounded-[14px] bg-stone" />
                        <div className="h-[340px] animate-pulse rounded-[14px] bg-stone" />
                        <div className="h-[340px] animate-pulse rounded-[14px] bg-stone" />
                        <div className="h-[340px] animate-pulse rounded-[14px] bg-stone" />
                    </div>
                )}

                {summary && (
                    <div
                        aria-busy={loading}
                        className={`flex flex-col gap-5 transition-opacity ${
                            loading ? 'opacity-60' : ''
                        }`}
                    >
                        <LiveTodayPanel
                            missingCheckIns={summary.missingCheckInTotal}
                            stats={summary.todayStats}
                        />

                        <div className="flex flex-wrap items-stretch gap-5">
                            <TodayShiftTimeline
                                date={summary.date}
                                now={summary.generatedAt}
                                shifts={summary.todayShifts}
                            />
                            <ApprovalQueue summary={summary} onChanged={reload} />
                        </div>

                        <div className="flex flex-wrap items-stretch gap-5">
                            <AttendanceTrendChart
                                data={summary.attendanceTrend}
                                days={summary.range.days}
                                workedMinutes={workedMinutes}
                            />
                            <PayrollPeriodPanel
                                date={summary.date}
                                period={summary.currentPayrollPeriod}
                                trend={summary.payrollTrend}
                            />
                        </div>

                        <BranchStatsTable
                            days={summary.range.days}
                            rows={summary.branchStats}
                        />
                    </div>
                )}
            </div>
        </section>
    );
}
