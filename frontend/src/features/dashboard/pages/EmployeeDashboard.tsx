import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '@/components/feedback';
import { routes } from '@/constants/routes';
import { checkIn, checkOut, getAttendanceErrorKey } from '@/features/attendance/api/attendance.api';
import { addDays, weekdayKeys, weekdayOf } from '@/features/work-schedules/lib/schedule-calendar';
import { type I18nKey, useI18n } from '@/i18n';
import { getDashboardErrorKey, getMyDashboard } from '../api/dashboard.api';
import {
    formatClockDate,
    formatHours,
    formatMoney,
    formatNumber,
    formatShortDate,
    formatTime,
    interpolate,
    minutesToHours,
} from '../lib/format';
import {
    type DashboardMine,
    type DashboardMyRequest,
    type DashboardMySchedule,
} from '../types';

// Check-in opens 30 minutes before the shift (backend attendance rule).
const checkInLeadMs = 30 * 60 * 1000;

type Phase = 'idle' | 'open' | 'in' | 'done' | 'missed' | 'leave' | 'absent';

const requestStatusStyles: Record<
    'pending' | 'approved' | 'rejected' | 'cancelled',
    { labelKey: I18nKey; className: string }
> = {
    pending: { labelKey: 'dashboard.requestStatus.pending', className: 'bg-ember-tint text-ember-ink' },
    approved: { labelKey: 'dashboard.requestStatus.approved', className: 'bg-[#dff0e4] text-[#1f6237]' },
    rejected: { labelKey: 'dashboard.requestStatus.rejected', className: 'bg-stone text-muted' },
    cancelled: { labelKey: 'dashboard.requestStatus.cancelled', className: 'bg-stone text-muted' },
};

function requestStatusOf(status: DashboardMyRequest['status']) {
    if (status === 'APPROVED' || status === 1) return requestStatusStyles.approved;
    if (status === 'REJECTED' || status === 2) return requestStatusStyles.rejected;
    if (status === 'CANCELLED' || status === 3) return requestStatusStyles.cancelled;
    return requestStatusStyles.pending;
}

function greetingKeyOf(hour: number): I18nKey {
    if (hour < 12) return 'dashboard.greeting.morning';
    if (hour < 18) return 'dashboard.greeting.afternoon';
    return 'dashboard.greeting.evening';
}

function vietnamHour(ms: number) {
    return new Date(ms + 7 * 60 * 60 * 1000).getUTCHours();
}

// Calendar date (YYYY-MM-DD) of an ISO timestamp in Vietnam time.
function vietnamDateOf(value: string) {
    return new Date(new Date(value).getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function pad(value: number) {
    return String(value).padStart(2, '0');
}

function formatElapsed(ms: number) {
    const seconds = Math.max(0, Math.floor(ms / 1000));
    return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor(seconds / 60) % 60)}:${pad(seconds % 60)}`;
}

function formatCountdown(ms: number) {
    const minutes = Math.max(0, Math.ceil(ms / 60000));
    return `${Math.floor(minutes / 60)}h ${pad(minutes % 60)}m`;
}

function phaseOf(schedule: DashboardMySchedule, now: number): Phase {
    if (schedule.isOnLeave && !schedule.attendanceStatus) return 'leave';
    if (schedule.attendanceStatus === 'CHECKED_IN') return 'in';
    if (schedule.attendanceStatus === 'ABSENT') return 'absent';
    if (schedule.attendanceStatus) return 'done';

    const start = new Date(schedule.scheduledStartAt).getTime();
    const end = new Date(schedule.scheduledEndAt).getTime();
    if (now >= end) return 'missed';
    return now >= start - checkInLeadMs ? 'open' : 'idle';
}

// The shift the hero card follows: the open one, else the next unfinished one, else the last.
function primaryScheduleOf(schedules: DashboardMySchedule[], now: number) {
    return (
        schedules.find((schedule) => schedule.attendanceStatus === 'CHECKED_IN') ??
        schedules.find(
            (schedule) =>
                !schedule.attendanceStatus &&
                !schedule.isOnLeave &&
                new Date(schedule.scheduledEndAt).getTime() > now,
        ) ??
        schedules[schedules.length - 1]
    );
}

function shiftMinutes(schedule: DashboardMySchedule) {
    return (
        (new Date(schedule.scheduledEndAt).getTime() -
            new Date(schedule.scheduledStartAt).getTime()) /
        60000
    );
}

// Personal dashboard for the `user` role (frontend/ui/Shiftly Nhan vien Dashboard.html).
export function EmployeeDashboard() {
    const { language, t } = useI18n();
    const { showToast } = useToast();
    const [dashboard, setDashboard] = useState<DashboardMine | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorKey, setErrorKey] = useState<I18nKey | null>(null);
    const [processing, setProcessing] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const [now, setNow] = useState(() => Date.now());

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

    useEffect(() => {
        const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(intervalId);
    }, []);

    function reload() {
        setLoading(true);
        setReloadKey((current) => current + 1);
    }

    async function runAttendanceAction(action: () => Promise<unknown>, successKey: I18nKey) {
        setProcessing(true);

        try {
            await action();
            showToast({ message: t(successKey), variant: 'success' });
            reload();
        } catch (actionError) {
            showToast({
                title: t('attendance.actionError'),
                message: t(getAttendanceErrorKey(actionError)),
                variant: 'error',
            });
        } finally {
            setProcessing(false);
        }
    }

    const today = dashboard?.todaySchedules ?? [];
    const upcoming = dashboard?.upcomingSchedules ?? [];
    const primary = primaryScheduleOf(today, now);
    const phase = primary ? phaseOf(primary, now) : null;
    const otherToday = today.filter((schedule) => schedule !== primary);
    const elapsedMs =
        primary?.checkInAt
            ? (primary.checkOutAt ? new Date(primary.checkOutAt).getTime() : now) -
              new Date(primary.checkInAt).getTime()
            : 0;

    const headline = !dashboard
        ? ''
        : phase === 'in'
          ? interpolate(t('dashboard.my.headlineInShift'), {
                duration: formatElapsed(elapsedMs).slice(0, 5),
            })
          : today.length > 0
            ? interpolate(t('dashboard.my.headlineToday'), {
                  today: today.length,
                  upcoming: upcoming.length,
              })
            : upcoming.length > 0
              ? interpolate(t('dashboard.my.headlineOff'), { upcoming: upcoming.length })
              : t('dashboard.my.headlineEmpty');

    return (
        <section className="bg-sand text-ink">
            <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5 p-8 max-sm:p-4">
                <div className="flex flex-wrap items-end justify-between gap-5">
                    <div className="flex flex-col gap-1.5">
                        <span className="tabular-nums text-xs tracking-[0.04em] text-muted uppercase">
                            {formatClockDate(new Date(now).toISOString(), language)}
                        </span>
                        <h1 className="text-[34px] leading-tight font-semibold tracking-[-0.03em] text-pretty max-sm:text-[28px]">
                            {interpolate(t(greetingKeyOf(vietnamHour(now))), {
                                name: dashboard?.employee.fullName ?? '',
                            })}
                        </h1>
                        {headline && <p className="text-[15px] text-muted">{headline}</p>}
                    </div>
                    <button
                        className="h-[38px] min-h-0 cursor-pointer rounded-lg border border-rule-strong bg-paper px-3.5 text-[13px] font-medium text-ink transition-colors hover:bg-stone-soft disabled:cursor-wait disabled:opacity-70"
                        disabled={loading}
                        type="button"
                        onClick={reload}
                    >
                        {loading ? t('dashboard.loading') : `↻ ${t('common.refresh')}`}
                    </button>
                </div>

                {errorKey && (
                    <div className="rounded-[10px] bg-ember-tint px-4 py-3 text-[13px] text-ember-ink" role="alert">
                        {t(errorKey)}
                    </div>
                )}

                {!dashboard && !errorKey && (
                    <div aria-busy="true" className="flex flex-col gap-5">
                        <div className="h-[230px] animate-pulse rounded-2xl bg-ink/90" />
                        <div className="h-[150px] animate-pulse rounded-[14px] bg-stone" />
                    </div>
                )}

                {dashboard && (
                    <div className={`flex flex-col gap-5 transition-opacity duration-200 ${loading ? 'opacity-60' : ''}`}>
                        <TodayCard
                            elapsedMs={elapsedMs}
                            next={upcoming[0]}
                            now={now}
                            otherToday={otherToday}
                            phase={phase}
                            primary={primary}
                            processing={processing}
                            onCheckIn={(schedule) =>
                                void runAttendanceAction(
                                    () => checkIn(schedule.workScheduleId),
                                    'attendance.checkedIn',
                                )
                            }
                            onCheckOut={(schedule) =>
                                schedule.attendanceId &&
                                void runAttendanceAction(
                                    () => checkOut(schedule.attendanceId!),
                                    'attendance.checkedOut',
                                )
                            }
                        />
                        <MonthCard dashboard={dashboard} />
                        <div className="flex flex-wrap items-stretch gap-5">
                            <WeekCard dashboard={dashboard} />
                            <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-5">
                                <PayslipCard dashboard={dashboard} />
                                <RequestsCard dashboard={dashboard} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

type TodayCardProps = {
    elapsedMs: number;
    next: DashboardMySchedule | undefined;
    now: number;
    otherToday: DashboardMySchedule[];
    phase: Phase | null;
    primary: DashboardMySchedule | undefined;
    processing: boolean;
    onCheckIn: (schedule: DashboardMySchedule) => void;
    onCheckOut: (schedule: DashboardMySchedule) => void;
};

function TodayCard({
    elapsedMs,
    next,
    now,
    otherToday,
    phase,
    primary,
    processing,
    onCheckIn,
    onCheckOut,
}: TodayCardProps) {
    const { language, t } = useI18n();

    return (
        <section className="flex flex-col gap-[22px] rounded-2xl bg-ink px-7 py-[26px] text-sand max-sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${phase === 'in' ? 'bg-live' : 'bg-ember'}`} />
                    <span className="text-[13px] font-semibold">{t('dashboard.my.todayTitle')}</span>
                </div>
                <Link className="text-[13px] text-fog hover:text-sand" to={routes.workSchedules}>
                    {t('dashboard.my.viewSchedule')}
                </Link>
            </div>

            {primary && phase ? (
                <TodayShift
                    elapsedMs={elapsedMs}
                    now={now}
                    phase={phase}
                    processing={processing}
                    schedule={primary}
                    onCheckIn={onCheckIn}
                    onCheckOut={onCheckOut}
                />
            ) : (
                <div className="flex flex-wrap items-center justify-between gap-5">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[28px] font-semibold tracking-[-0.03em]">
                            {t('dashboard.my.dayOff')}
                        </span>
                        <span className="text-sm text-fog">
                            {next
                                ? interpolate(t('dashboard.my.nextShift'), {
                                      day: `${t(weekdayKeys[weekdayOf(next.workDate)])} ${formatShortDate(next.workDate, language)}`,
                                      time: `${formatTime(next.scheduledStartAt, language)}–${formatTime(next.scheduledEndAt, language)}`,
                                  })
                                : t('dashboard.my.noUpcoming')}
                        </span>
                    </div>
                    <Link
                        className="flex h-[46px] items-center rounded-[10px] border border-ink-line px-[18px] text-sm font-medium text-sand transition-colors hover:bg-[#26251d] hover:text-sand"
                        to={routes.shiftRequests}
                    >
                        {t('dashboard.my.registerShift')}
                    </Link>
                </div>
            )}

            {otherToday.length > 0 && (
                <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-ink-soft pt-4 text-[13px] text-fog">
                    <span>{t('dashboard.my.otherShiftsToday')}</span>
                    {otherToday.map((schedule) => (
                        <span className="text-sand" key={schedule.workScheduleId}>
                            <span className="tabular-nums">
                                {formatTime(schedule.scheduledStartAt, language)}–{formatTime(schedule.scheduledEndAt, language)}
                            </span>{' '}
                            · {schedule.shiftName}
                        </span>
                    ))}
                </div>
            )}
        </section>
    );
}

type TodayShiftProps = {
    elapsedMs: number;
    now: number;
    phase: Phase;
    processing: boolean;
    schedule: DashboardMySchedule;
    onCheckIn: (schedule: DashboardMySchedule) => void;
    onCheckOut: (schedule: DashboardMySchedule) => void;
};

function TodayShift({
    elapsedMs,
    now,
    phase,
    processing,
    schedule,
    onCheckIn,
    onCheckOut,
}: TodayShiftProps) {
    const { language, t } = useI18n();
    const start = new Date(schedule.scheduledStartAt).getTime();
    const end = new Date(schedule.scheduledEndAt).getTime();
    const percent = (time: number) =>
        `${Math.max(0, Math.min(100, ((time - start) / (end - start)) * 100))}%`;
    const workedFrom = schedule.checkInAt ? new Date(schedule.checkInAt).getTime() : null;
    const workedTo = schedule.checkOutAt ? new Date(schedule.checkOutAt).getTime() : now;

    const status: Record<Phase, { titleKey: I18nKey; value: string; tone: string }> = {
        idle: { titleKey: 'dashboard.my.startsIn', value: formatCountdown(start - now), tone: 'text-sand' },
        open: {
            titleKey: now < start ? 'dashboard.my.startsIn' : 'dashboard.my.inProgress',
            value: now < start ? formatCountdown(start - now) : t('dashboard.my.notCheckedIn'),
            tone: now < start ? 'text-sand' : 'text-ember',
        },
        in: { titleKey: 'dashboard.my.worked', value: formatElapsed(elapsedMs), tone: 'text-[#7fd39a]' },
        done: { titleKey: 'dashboard.my.totalTime', value: formatElapsed(elapsedMs), tone: 'text-sand' },
        missed: { titleKey: 'dashboard.my.ended', value: t('dashboard.my.noAttendance'), tone: 'text-faint' },
        leave: { titleKey: 'dashboard.my.leaveTitle', value: t('dashboard.my.onLeave'), tone: 'text-fog' },
        absent: { titleKey: 'dashboard.my.ended', value: t('dashboard.my.absent'), tone: 'text-ember' },
    };
    const current = status[phase];

    let action = null;
    if (phase === 'idle' || phase === 'open') {
        action = (
            <button
                className="h-[54px] min-h-0 cursor-pointer rounded-xl border-0 bg-ember px-[26px] text-base font-semibold text-ink transition-colors hover:bg-[#ea7d43] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={phase === 'idle' || processing}
                title={
                    phase === 'idle'
                        ? interpolate(t('dashboard.my.checkInOpensAt'), {
                              time: formatTime(new Date(start - checkInLeadMs).toISOString(), language),
                          })
                        : undefined
                }
                type="button"
                onClick={() => onCheckIn(schedule)}
            >
                {processing ? t('common.loadingSave') : t('dashboard.my.checkIn')}
            </button>
        );
    } else if (phase === 'in') {
        action = (
            <button
                className="h-[54px] min-h-0 cursor-pointer rounded-xl border-0 bg-sand px-[26px] text-base font-semibold text-ink transition-colors hover:bg-white disabled:cursor-wait disabled:opacity-70"
                disabled={processing}
                type="button"
                onClick={() => onCheckOut(schedule)}
            >
                {processing ? t('common.loadingSave') : t('dashboard.my.checkOut')}
            </button>
        );
    } else if (phase === 'done') {
        action = (
            <span className="flex h-[54px] items-center rounded-xl bg-ink-soft px-[26px] text-base font-semibold text-faint">
                {t('dashboard.my.completed')}
            </span>
        );
    }

    return (
        <>
            <div className="flex flex-wrap items-center justify-between gap-7">
                <div className="flex min-w-0 flex-col gap-1.5">
                    <span className="text-[clamp(32px,4vw,48px)] leading-none font-semibold tracking-[-0.04em] tabular-nums">
                        {formatTime(schedule.scheduledStartAt, language)} – {formatTime(schedule.scheduledEndAt, language)}
                    </span>
                    <span className="text-[15px] text-[#c9c5b8]">
                        {schedule.shiftName} · {schedule.branchName} · {schedule.positionName}
                    </span>
                </div>
                <div className="flex flex-wrap items-center gap-[18px]">
                    <div className="flex flex-col gap-0.5 text-right">
                        <span className="text-xs text-fog">{t(current.titleKey)}</span>
                        <span className={`text-[22px] font-medium tabular-nums ${current.tone}`}>
                            {current.value}
                        </span>
                    </div>
                    {action}
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <div className="relative h-2 rounded bg-ink-soft">
                    {workedFrom !== null && (
                        <div
                            className="absolute inset-y-0 rounded bg-sand"
                            style={{
                                left: percent(workedFrom),
                                width: `calc(${percent(workedTo)} - ${percent(workedFrom)})`,
                            }}
                        />
                    )}
                    {now >= start && now <= end && (
                        <div className="absolute -inset-y-[5px] w-0.5 bg-ember" style={{ left: percent(now) }} />
                    )}
                </div>
                <div className="flex justify-between text-[11px] text-faint tabular-nums">
                    <span>{formatTime(schedule.scheduledStartAt, language)}</span>
                    <span>{formatTime(new Date((start + end) / 2).toISOString(), language)}</span>
                    <span>{formatTime(schedule.scheduledEndAt, language)}</span>
                </div>
            </div>

            {schedule.checkInAt && (
                <div className="flex flex-wrap gap-6 border-t border-ink-soft pt-4 text-[13px] text-fog">
                    <span>
                        {t('dashboard.my.checkIn')}{' '}
                        <span className="text-sand tabular-nums">{formatTime(schedule.checkInAt, language)}</span>
                    </span>
                    {schedule.checkOutAt && (
                        <span>
                            {t('dashboard.my.checkOut')}{' '}
                            <span className="text-sand tabular-nums">{formatTime(schedule.checkOutAt, language)}</span>
                        </span>
                    )}
                </div>
            )}
        </>
    );
}

function CardTitle({ title, note }: { title: string; note?: string }) {
    return (
        <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-[17px] font-semibold tracking-[-0.01em]">{title}</h2>
            {note && <span className="text-[13px] text-muted">{note}</span>}
        </div>
    );
}

function MonthCard({ dashboard }: { dashboard: DashboardMine }) {
    const { language, t } = useI18n();
    const month = dashboard.monthStats;
    const remaining = Math.max(0, month.scheduledShifts - month.attendedShifts - month.absentCount);
    const average = month.attendedShifts ? minutesToHours(month.workedMinutes) / month.attendedShifts : 0;
    const kpis = [
        {
            label: t('dashboard.my.attendedShifts'),
            value: month.attendedShifts,
            unit: `/ ${month.scheduledShifts}`,
            note: interpolate(t('dashboard.my.remainingShifts'), { count: remaining }),
            tone: 'text-ink',
        },
        {
            label: t('dashboard.my.workedHours'),
            value: formatHours(month.workedMinutes, language),
            unit: t('dashboard.my.hoursUnit'),
            note: month.attendedShifts
                ? interpolate(t('dashboard.my.avgPerShift'), { hours: formatNumber(average, language) })
                : '—',
            tone: 'text-ink',
        },
        {
            label: t('dashboard.my.overtimeHours'),
            value: formatHours(month.overtimeMinutes, language),
            unit: t('dashboard.my.hoursUnit'),
            note: t('dashboard.my.overtimeNote'),
            tone: 'text-ink',
        },
        {
            label: t('dashboard.my.lateCount'),
            value: month.lateCount,
            unit: t('dashboard.my.timesUnit'),
            note: interpolate(t('dashboard.my.lateHint'), {
                minutes: month.lateMinutes,
                absent: month.absentCount,
            }),
            tone: month.lateCount > 0 ? 'text-ember-strong' : 'text-ink',
        },
    ];

    return (
        <section className="flex flex-col gap-3.5 rounded-[14px] border border-rule bg-paper px-6 py-[22px] max-sm:px-4">
            <CardTitle
                note={t('dashboard.my.monthNote')}
                title={interpolate(t('dashboard.my.monthTitle'), {
                    month: Number(dashboard.date.slice(5, 7)),
                })}
            />
            <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))]">
                {kpis.map((kpi) => (
                    <div className="flex flex-col gap-1 border-l border-rule px-5 py-1.5" key={kpi.label}>
                        <span className="text-[13px] text-muted">{kpi.label}</span>
                        <div className="flex items-baseline gap-1.5">
                            <span className={`text-4xl leading-[1.1] font-semibold tracking-[-0.04em] tabular-nums ${kpi.tone}`}>
                                {kpi.value}
                            </span>
                            <span className="text-sm text-muted">{kpi.unit}</span>
                        </div>
                        <span className="text-xs text-muted">{kpi.note}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}

function WeekCard({ dashboard }: { dashboard: DashboardMine }) {
    const { language, t } = useI18n();
    const days = Array.from({ length: 7 }, (_, index) => addDays(dashboard.date, index + 1));
    const byDate = new Map<string, DashboardMySchedule[]>();

    for (const schedule of dashboard.upcomingSchedules) {
        const list = byDate.get(schedule.workDate);
        if (list) list.push(schedule);
        else byDate.set(schedule.workDate, [schedule]);
    }

    const totalMinutes = dashboard.upcomingSchedules.reduce(
        (total, schedule) => total + shiftMinutes(schedule),
        0,
    );

    return (
        <section className="flex min-w-0 flex-[1.7_1_560px] flex-col gap-4 rounded-[14px] border border-rule bg-paper px-6 py-[22px] max-sm:px-4">
            <CardTitle
                note={
                    dashboard.upcomingSchedules.length
                        ? interpolate(t('dashboard.my.weekNote'), {
                              shifts: dashboard.upcomingSchedules.length,
                              hours: formatHours(totalMinutes, language),
                          })
                        : t('dashboard.my.noUpcoming')
                }
                title={t('dashboard.my.upcomingTitle')}
            />
            <div className="overflow-x-auto">
                <div className="grid min-w-[620px] grid-cols-7 gap-2">
                    {days.map((day) => {
                        const schedules = byDate.get(day) ?? [];
                        const weekday = weekdayOf(day);
                        const weekend = weekday === 0 || weekday === 6;

                        return (
                            <div
                                className={`flex min-h-[150px] flex-col gap-2.5 rounded-[10px] border px-2.5 py-3 ${
                                    schedules.length ? 'border-rule bg-paper' : 'border-transparent bg-[#f2efe8]'
                                }`}
                                key={day}
                            >
                                <div className="flex flex-col gap-px">
                                    <span
                                        className={`text-[11px] font-semibold tracking-[0.04em] ${
                                            weekend ? 'text-ember-strong' : 'text-muted'
                                        }`}
                                    >
                                        {t(weekdayKeys[weekday])}
                                    </span>
                                    <span className="text-xl font-semibold tracking-[-0.02em] tabular-nums">
                                        {Number(day.slice(8, 10))}
                                    </span>
                                </div>
                                {schedules.map((schedule) => (
                                    <div
                                        className={`flex flex-col gap-0.5 rounded-[7px] px-2 py-[7px] ${
                                            schedule.isOnLeave ? 'bg-stone text-muted' : 'bg-ink text-sand'
                                        }`}
                                        key={schedule.workScheduleId}
                                    >
                                        <span className="text-[11px] tabular-nums">
                                            {formatTime(schedule.scheduledStartAt, language)}–{formatTime(schedule.scheduledEndAt, language)}
                                        </span>
                                        <span className="truncate text-xs font-semibold">{schedule.shiftName}</span>
                                        <span className={`truncate text-[11px] ${schedule.isOnLeave ? '' : 'text-fog'}`}>
                                            {schedule.isOnLeave ? t('dashboard.my.onLeave') : schedule.branchName}
                                        </span>
                                    </div>
                                ))}
                                {schedules.length === 0 && (
                                    <span className="text-xs text-faint">{t('dashboard.my.off')}</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

function PayslipCard({ dashboard }: { dashboard: DashboardMine }) {
    const { language, t } = useI18n();
    const payslip = dashboard.latestPayslip;

    return (
        <section className="flex flex-col gap-3.5 rounded-[14px] border border-rule bg-paper px-6 py-[22px] max-sm:px-4">
            <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-[17px] font-semibold tracking-[-0.01em]">{t('dashboard.my.payslipTitle')}</h2>
                {payslip && (
                    <span className="truncate text-xs tracking-[0.04em] text-muted uppercase">
                        {payslip.payrollPeriodName}
                    </span>
                )}
            </div>
            {payslip ? (
                <div className="flex flex-col gap-3.5">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[13px] text-muted">{t('dashboard.my.netPay')}</span>
                        <span className="text-[30px] font-semibold tracking-[-0.03em] tabular-nums">
                            {formatMoney(payslip.netPay, language)}{' '}
                            <span className="text-base text-muted">₫</span>
                        </span>
                    </div>
                    <div className="flex justify-between gap-3 text-[13px]">
                        <span className="text-muted">{t('dashboard.my.grossPay')}</span>
                        <span className="tabular-nums">{formatMoney(payslip.grossPay, language)}</span>
                    </div>
                    <Link className="text-[13px] font-semibold" to={routes.payslips}>
                        {t('dashboard.my.viewPayslip')}
                    </Link>
                </div>
            ) : (
                <span className="text-[13px] text-muted">{t('dashboard.my.noPayslip')}</span>
            )}
        </section>
    );
}

function RequestsCard({ dashboard }: { dashboard: DashboardMine }) {
    const { language, t } = useI18n();
    const linkClass =
        'flex h-[30px] items-center rounded-md border border-rule-strong px-2.5 text-xs font-medium text-ink transition-colors hover:bg-stone-soft hover:text-ink';

    return (
        <section className="flex flex-col gap-3 rounded-[14px] border border-rule bg-paper pt-[22px] pb-2">
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 max-sm:px-4">
                <h2 className="text-[17px] font-semibold tracking-[-0.01em]">{t('dashboard.my.requestsTitle')}</h2>
                <div className="flex gap-1.5">
                    <Link className={linkClass} to={routes.leaveRequests}>
                        {t('dashboard.my.newLeave')}
                    </Link>
                    <Link className={linkClass} to={routes.shiftRequests}>
                        {t('dashboard.my.newShift')}
                    </Link>
                </div>
            </div>
            {dashboard.recentRequests.map((request) => {
                const status = requestStatusOf(request.status);

                return (
                    <Link
                        className="flex items-center justify-between gap-3 border-t border-rule-soft px-6 py-3 text-ink transition-colors hover:bg-[#f6f4ef] hover:text-ink max-sm:px-4"
                        key={`${request.type}-${request.id}`}
                        to={request.type === 'LEAVE' ? routes.leaveRequests : routes.shiftRequests}
                    >
                        <span className="flex min-w-0 flex-col gap-0.5">
                            <span className="truncate text-sm font-medium">
                                {request.type === 'LEAVE'
                                    ? t('dashboard.my.leaveRequest')
                                    : t('dashboard.my.shiftRequest')}
                                {' · '}
                                {request.label}
                                {request.date && ` · ${formatShortDate(request.date, language)}`}
                            </span>
                            <span className="text-xs text-muted">
                                {interpolate(t('dashboard.my.sentOn'), {
                                    date: formatShortDate(vietnamDateOf(request.createdAt), language),
                                })}
                            </span>
                        </span>
                        <span className={`flex-none rounded px-2 py-0.5 text-[11px] font-semibold ${status.className}`}>
                            {t(status.labelKey)}
                        </span>
                    </Link>
                );
            })}
            {dashboard.recentRequests.length === 0 && (
                <span className="border-t border-rule-soft px-6 py-3 text-[13px] text-muted max-sm:px-4">
                    {t('dashboard.my.noRequests')}
                </span>
            )}
        </section>
    );
}
