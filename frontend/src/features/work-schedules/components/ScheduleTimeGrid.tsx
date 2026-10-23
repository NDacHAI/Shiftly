import { interpolate } from '@/features/dashboard/lib/format';
import { useI18n } from '@/i18n';
import {
    hourHeight,
    hourWindow,
    layoutLanes,
    type ShiftBlock,
    weekdayKeys,
    weekdayOf,
    employeeName,
    formatTime,
} from '../lib/schedule-calendar';

type ScheduleTimeGridProps = {
    blocksByDate: Record<string, ShiftBlock[]>;
    days: string[];
    now: { date: string; minutes: number };
    openBlockId: string | null;
    search: string;
    selectedDate: string;
    showBranch: boolean;
    onPickBlock: (block: ShiftBlock) => void;
    onSelectDate: (date: string) => void;
};

function blockTone(block: ShiftBlock) {
    return block.ended ? 'border-stone bg-stone text-muted' : 'border-ink bg-ink text-sand';
}

// Day / week view: one column per day, shifts placed on an hourly timeline.
export function ScheduleTimeGrid({
    blocksByDate,
    days,
    now,
    openBlockId,
    search,
    selectedDate,
    showBranch,
    onPickBlock,
    onSelectDate,
}: ScheduleTimeGridProps) {
    const { t } = useI18n();
    const isDay = days.length === 1;
    const query = search.trim().toLowerCase();
    const { firstHour, lastHour } = hourWindow(days.flatMap((day) => blocksByDate[day] ?? []));
    const hours = Array.from({ length: lastHour - firstHour }, (_, index) => firstHour + index);
    const gridHeight = (lastHour - firstHour) * hourHeight;
    const columns = days.map((day) => ({
        day,
        ...layoutLanes(blocksByDate[day] ?? []),
    }));
    const maxLanes = Math.max(...columns.map((column) => column.laneCount));
    const minWidth = isDay ? undefined : 56 + 7 * Math.max(130, maxLanes * 78);
    const gridTemplateColumns = `56px repeat(${days.length}, minmax(0, 1fr))`;

    function matches(block: ShiftBlock) {
        if (!query) return true;

        return block.schedules.some((schedule) =>
            `${employeeName(schedule.employee)} ${schedule.employee.employeeCode}`
                .toLowerCase()
                .includes(query),
        );
    }

    return (
        <div className="max-h-[640px] overflow-auto">
            <div style={{ minWidth }}>
                <div
                    className="sticky top-0 z-[3] grid border-b border-rule bg-paper"
                    style={{ gridTemplateColumns }}
                >
                    <span />
                    {days.map((day) => {
                        const selected = day === selectedDate;

                        return (
                            <button
                                aria-pressed={selected}
                                className={`flex min-h-0 cursor-pointer flex-col items-start gap-0.5 border-0 border-l border-rule-soft px-2 py-2.5 text-left transition-colors duration-200 ${
                                    selected ? 'bg-[#f2efe8]' : 'bg-transparent hover:bg-[#f6f4ef]'
                                }`}
                                key={day}
                                type="button"
                                onClick={() => onSelectDate(day)}
                            >
                                <span
                                    className={`text-[11px] font-semibold tracking-[0.04em] ${
                                        day === now.date ? 'text-ember-strong' : 'text-muted'
                                    }`}
                                >
                                    {t(weekdayKeys[weekdayOf(day)])}
                                </span>
                                <span className="flex w-full items-center gap-2">
                                    <span
                                        className={`text-xl font-semibold tracking-[-0.02em] tabular-nums ${
                                            day < now.date ? 'text-faint' : 'text-ink'
                                        }`}
                                    >
                                        {Number(day.slice(8, 10))}
                                    </span>
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="grid" style={{ gridTemplateColumns, height: gridHeight }}>
                    <div className="relative">
                        {hours.map((hour, index) => (
                            <span
                                className="absolute right-2 -translate-y-1/2 text-[10px] text-faint tabular-nums"
                                key={hour}
                                style={{ top: Math.max(8, index * hourHeight) }}
                            >
                                {String(hour).padStart(2, '0')}:00
                            </span>
                        ))}
                    </div>

                    {columns.map(({ day, placed, laneCount }) => (
                        <div
                            className={`relative border-l border-rule-soft transition-colors duration-200 ${
                                day === selectedDate ? 'bg-[#f6f4ef]' : ''
                            }`}
                            key={day}
                            style={{
                                backgroundImage: `repeating-linear-gradient(to bottom, var(--color-rule-soft) 0px, var(--color-rule-soft) 1px, transparent 1px, transparent ${hourHeight}px)`,
                            }}
                        >
                            {placed.map(({ block, lane }) => {
                                const top =
                                    ((block.startMinutes - firstHour * 60) / 60) * hourHeight + 1;
                                const bottom = Math.min(
                                    gridHeight,
                                    ((block.endMinutes - firstHour * 60) / 60) * hourHeight,
                                );
                                const compact = laneCount > 1;
                                const count = block.schedules.length;
                                const fill = compact
                                    ? String(count)
                                    : interpolate(t('workSchedules.peopleCount'), { count });

                                return (
                                    <button
                                        className={`absolute flex min-h-0 cursor-pointer flex-col gap-0.5 overflow-hidden rounded-[7px] border px-[7px] py-1.5 text-left transition-[opacity,box-shadow,transform] duration-200 hover:-translate-y-px ${blockTone(block)} ${matches(block) ? 'opacity-100' : 'opacity-25'} ${
                                            openBlockId === block.id
                                                ? 'z-[2] shadow-[0_0_0_2px_var(--color-paper),0_0_0_4px_var(--color-ember)]'
                                                : 'z-[1]'
                                        }`}
                                        key={block.id}
                                        style={{
                                            top,
                                            height: Math.max(24, bottom - top - 2),
                                            left: `calc(3px + (100% - 4px) * ${lane / laneCount})`,
                                            width: `calc((100% - 4px) / ${laneCount} - 3px)`,
                                        }}
                                        title={`${block.shiftName} · ${block.branchName} · ${formatTime(block.startTime)}–${formatTime(block.endTime)}`}
                                        type="button"
                                        onClick={() => onPickBlock(block)}
                                    >
                                        <span className="text-[10px] whitespace-nowrap tabular-nums opacity-80">
                                            {compact
                                                ? `${Number(block.startTime.slice(0, 2))}–${Number(block.endTime.slice(0, 2))}h`
                                                : `${formatTime(block.startTime)}–${formatTime(block.endTime)}`}
                                        </span>
                                        <span className="truncate text-xs leading-tight font-semibold">
                                            {showBranch
                                                ? `${block.shiftName} · ${block.branchName}`
                                                : block.shiftName}
                                        </span>
                                        <span className="text-[11px] whitespace-nowrap opacity-85">
                                            {fill}
                                        </span>
                                        {isDay && (
                                            <span className="text-[11px] leading-snug opacity-75">
                                                {block.schedules
                                                    .map((schedule) => employeeName(schedule.employee))
                                                    .join(', ')}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}

                            {day === now.date &&
                                now.minutes >= firstHour * 60 &&
                                now.minutes <= lastHour * 60 && (
                                    <div
                                        className="pointer-events-none absolute inset-x-0 z-[2] h-0.5 bg-ember"
                                        style={{
                                            top: ((now.minutes - firstHour * 60) / 60) * hourHeight,
                                        }}
                                    >
                                        <span className="absolute -top-[3px] -left-1 size-2 rounded-full bg-ember" />
                                    </div>
                                )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
