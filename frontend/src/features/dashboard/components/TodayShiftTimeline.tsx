import { useI18n } from '@/i18n';
import { formatTime, hoursSinceDayStart, interpolate } from '../lib/format';
import { type DashboardTodayShift } from '../types';
import { DashboardCard } from './DashboardCard';

type ShiftState = 'full' | 'short' | 'upcoming' | 'ended';

const LABEL_WIDTH = 160;

const stateClasses: Record<ShiftState, string> = {
    full: 'border-transparent bg-ink text-sand',
    short: 'border-ember bg-ember-tint text-ember-ink',
    upcoming: 'border-rule-strong bg-paper text-ink',
    ended: 'border-transparent bg-stone text-muted',
};

type TodayShiftTimelineProps = {
    shifts: DashboardTodayShift[];
    date: string;
    now: string;
};

export function TodayShiftTimeline({ shifts, date, now }: TodayShiftTimelineProps) {
    const { language, t } = useI18n();
    const nowHour = hoursSinceDayStart(now, date);

    const rows = shifts.map((shift) => {
        const start = hoursSinceDayStart(shift.scheduledStartAt, date);
        const end = hoursSinceDayStart(shift.scheduledEndAt, date);
        const expected = Math.max(shift.scheduled - shift.onLeave, 0);
        let state: ShiftState = 'full';

        if (end <= nowHour) state = 'ended';
        else if (start > nowHour) state = 'upcoming';
        else if (shift.checkedIn < expected) state = 'short';

        return { ...shift, start, end, expected, state };
    });

    const firstHour = Math.min(6, ...rows.map((row) => Math.floor(row.start)));
    const lastHour = Math.min(
        24,
        Math.max(23, ...rows.map((row) => Math.ceil(row.end))),
    );
    const span = lastHour - firstHour;
    const toPercent = (hour: number) =>
        (Math.min(Math.max(hour, firstHour), lastHour) - firstHour) / span * 100;
    const ticks: number[] = [];

    for (let hour = Math.ceil(firstHour / 2) * 2; hour <= lastHour; hour += 2) {
        ticks.push(hour);
    }

    const shortRows = rows.filter((row) => row.state === 'short');
    const shortPeople = shortRows.reduce(
        (total, row) => total + row.expected - row.checkedIn,
        0,
    );
    const showNow = nowHour >= firstHour && nowHour <= lastHour;

    const legend: Array<{ state: ShiftState; label: string }> = [
        { state: 'full', label: t('dashboard.shifts.full') },
        { state: 'short', label: t('dashboard.shifts.short') },
        { state: 'upcoming', label: t('dashboard.shifts.upcoming') },
        { state: 'ended', label: t('dashboard.shifts.ended') },
    ];

    return (
        <DashboardCard
            action={
                rows.length > 0 && (
                    <span className="text-[13px] text-muted">
                        {shortRows.length > 0
                            ? interpolate(t('dashboard.shifts.shortNote'), {
                                  people: shortPeople,
                                  shifts: shortRows.length,
                              })
                            : t('dashboard.shifts.allGood')}
                    </span>
                )
            }
            className="flex-[1.7_1_560px]"
            title={t('dashboard.shifts.title')}
        >
            {rows.length === 0 ? (
                <div className="flex flex-col items-center gap-1 py-12 text-center">
                    <span className="text-[15px] font-semibold text-ink">
                        {t('dashboard.shifts.empty')}
                    </span>
                    <span className="text-[13px] text-muted">
                        {t('dashboard.shifts.emptyDescription')}
                    </span>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    <div className="overflow-x-auto">
                        <div className="relative flex min-w-[560px] flex-col">
                            <div
                                className="grid h-[22px]"
                                style={{ gridTemplateColumns: `${LABEL_WIDTH}px minmax(0, 1fr)` }}
                            >
                                <span />
                                <div className="relative">
                                    {ticks.map((hour) => (
                                        <span
                                            className="absolute -translate-x-1/2 tabular-nums text-[11px] text-faint"
                                            key={hour}
                                            style={{ left: `${toPercent(hour)}%` }}
                                        >
                                            {String(hour).padStart(2, '0')}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {rows.map((row) => (
                                <div
                                    className="grid h-[52px] items-center border-t border-rule-soft"
                                    key={`${row.branchId}-${row.shiftName}-${row.scheduledStartAt}`}
                                    style={{ gridTemplateColumns: `${LABEL_WIDTH}px minmax(0, 1fr)` }}
                                >
                                    <div className="flex min-w-0 flex-col gap-0.5 pr-3">
                                        <span className="truncate text-[13px] font-semibold text-ink">
                                            {row.shiftName}
                                        </span>
                                        <span className="truncate text-xs text-muted">
                                            {row.branchName}
                                        </span>
                                    </div>
                                    <div className="relative h-full">
                                        <div
                                            className={`absolute inset-y-2.5 flex items-center justify-between gap-2 overflow-hidden rounded-[7px] border px-2.5 ${stateClasses[row.state]}`}
                                            style={{
                                                left: `${toPercent(row.start)}%`,
                                                width: `${toPercent(row.end) - toPercent(row.start)}%`,
                                            }}
                                            title={`${row.shiftName} · ${row.branchName}`}
                                        >
                                            <span className="tabular-nums text-[11px] whitespace-nowrap">
                                                {formatTime(row.scheduledStartAt, language)}–
                                                {formatTime(row.scheduledEndAt, language)}
                                            </span>
                                            <span className="text-xs font-semibold whitespace-nowrap tabular-nums">
                                                {row.checkedIn}/{row.expected}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {showNow && (
                                <div
                                    aria-hidden="true"
                                    className="pointer-events-none absolute top-[22px] bottom-0 w-0.5 bg-ember"
                                    style={{
                                        left: `calc(${LABEL_WIDTH}px + (100% - ${LABEL_WIDTH}px) * ${toPercent(nowHour) / 100})`,
                                    }}
                                >
                                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 rounded bg-ember px-[5px] py-px tabular-nums text-[10px] font-medium text-ink">
                                        {formatTime(now, language)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <ul className="flex flex-wrap gap-x-[18px] gap-y-1 text-xs text-muted">
                        {legend.map((item) => (
                            <li className="flex items-center gap-1.5" key={item.state}>
                                <span
                                    aria-hidden="true"
                                    className={`size-2.5 rounded-[3px] border ${stateClasses[item.state]}`}
                                />
                                {item.label}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </DashboardCard>
    );
}
