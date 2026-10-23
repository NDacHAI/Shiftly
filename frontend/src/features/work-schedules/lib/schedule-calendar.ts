import { type I18nKey } from '@/i18n';
import { type WorkSchedule, type WorkScheduleViewMode } from '../types';

// Staffing target per shift block; the backend has no headcount field yet.
export const defaultStaffTarget = 4;
export const hourHeight = 44;
const defaultFirstHour = 6;
const defaultLastHour = 24;

export const weekdayKeys: I18nKey[] = [
    'workSchedules.sunday',
    'workSchedules.monday',
    'workSchedules.tuesday',
    'workSchedules.wednesday',
    'workSchedules.thursday',
    'workSchedules.friday',
    'workSchedules.saturday',
];

// Monday-first order used by the month grid header.
export const mondayFirstWeekdayKeys = [...weekdayKeys.slice(1), weekdayKeys[0]];

// ---------- Dates as YYYY-MM-DD strings (UTC math, no local-time drift) ----------

export function toUtcDate(value: string) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
}

function fromUtcDate(value: Date) {
    return value.toISOString().slice(0, 10);
}

export function addDays(value: string, days: number) {
    const date = toUtcDate(value);
    date.setUTCDate(date.getUTCDate() + days);
    return fromUtcDate(date);
}

export function startOfWeek(value: string) {
    const day = toUtcDate(value).getUTCDay() || 7;
    return addDays(value, 1 - day);
}

export function startOfMonth(value: string) {
    return `${value.slice(0, 8)}01`;
}

function endOfMonth(value: string) {
    const date = toUtcDate(startOfMonth(value));
    date.setUTCMonth(date.getUTCMonth() + 1, 0);
    return fromUtcDate(date);
}

export function weekdayOf(value: string) {
    return toUtcDate(value).getUTCDay();
}

// ISO weekday used by the bulk API: Monday = 1 ... Sunday = 7.
export function isoWeekdayOf(value: string) {
    return weekdayOf(value) || 7;
}

// Dates from start to end (inclusive) on the given ISO weekdays, stopping at `limit` items.
export function expandDateRange(
    startDate: string,
    endDate: string,
    isoWeekdays: number[],
    limit: number,
) {
    const dates: string[] = [];

    for (let day = startDate; day <= endDate && dates.length < limit; day = addDays(day, 1)) {
        if (isoWeekdays.includes(isoWeekdayOf(day))) dates.push(day);
    }

    return dates;
}

export function weekDays(value: string) {
    const first = startOfWeek(value);
    return Array.from({ length: 7 }, (_, index) => addDays(first, index));
}

export function getViewRange(anchorDate: string, viewMode: WorkScheduleViewMode) {
    if (viewMode === 'day') return { fromDate: anchorDate, toDate: anchorDate };
    if (viewMode === 'week') {
        const fromDate = startOfWeek(anchorDate);
        return { fromDate, toDate: addDays(fromDate, 6) };
    }

    const gridStart = startOfWeek(startOfMonth(anchorDate));
    return { fromDate: gridStart, toDate: addDays(gridStart, 41) };
}

export function moveAnchorDate(
    anchorDate: string,
    viewMode: WorkScheduleViewMode,
    step: number,
) {
    if (viewMode === 'day') return addDays(anchorDate, step);
    if (viewMode === 'week') return addDays(anchorDate, step * 7);

    const date = toUtcDate(startOfMonth(anchorDate));
    date.setUTCMonth(date.getUTCMonth() + step);
    return fromUtcDate(date);
}

// Month grid: 5 rows, or 6 when the month spills into a sixth week.
export function monthGridDays(anchorDate: string) {
    const gridStart = startOfWeek(startOfMonth(anchorDate));
    const lastDay = endOfMonth(anchorDate);
    const days = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));

    return days[35] <= lastDay ? days : days.slice(0, 35);
}

export function vietnamNow() {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(new Date());
    const part = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((item) => item.type === type)?.value ?? '00';

    return {
        date: `${part('year')}-${part('month')}-${part('day')}`,
        minutes: Number(part('hour')) * 60 + Number(part('minute')),
    };
}

// ---------- Formatting ----------

export function formatTime(value: string) {
    return value.slice(0, 5);
}

export function formatDayMonth(value: string) {
    return `${value.slice(8, 10)}.${value.slice(5, 7)}`;
}

export function formatDuration(minutes: number) {
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    if (!hours) return `${remainder}m`;
    if (!remainder) return `${hours}h`;
    return `${hours}h ${remainder}m`;
}

function capitalize(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatWeekdayLong(value: string, locale: string) {
    return capitalize(
        new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' }).format(
            toUtcDate(value),
        ),
    );
}

export function formatLongDate(value: string, locale: string) {
    return new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(toUtcDate(value));
}

export function formatRangeLabel(
    anchorDate: string,
    viewMode: WorkScheduleViewMode,
    locale: string,
) {
    if (viewMode === 'day') {
        return `${formatWeekdayLong(anchorDate, locale)}, ${formatDayMonth(anchorDate)}.${anchorDate.slice(0, 4)}`;
    }

    if (viewMode === 'week') {
        const first = startOfWeek(anchorDate);
        const last = addDays(first, 6);
        return `${formatDayMonth(first)} – ${formatDayMonth(last)}.${last.slice(0, 4)}`;
    }

    return capitalize(
        new Intl.DateTimeFormat(locale, {
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC',
        }).format(toUtcDate(startOfMonth(anchorDate))),
    );
}

export function employeeName(employee: { firstName: string; lastName: string }) {
    return [employee.lastName, employee.firstName]
        .map((part) => part.trim())
        .filter(Boolean)
        .join(' ');
}

// ---------- Shift blocks: schedules grouped by date, branch and shift ----------

export type ShiftBlock = {
    id: string;
    date: string;
    branchId: string;
    branchName: string;
    workShiftId: string;
    shiftName: string;
    shiftCode: string;
    startTime: string;
    endTime: string;
    isOvernight: boolean;
    startMinutes: number;
    endMinutes: number;
    schedules: WorkSchedule[];
    need: number;
    shortage: number;
    ended: boolean;
};

function toMinutes(time: string) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

export function buildShiftBlocks(
    schedules: WorkSchedule[],
    now: { date: string; minutes: number },
): Record<string, ShiftBlock[]> {
    const groups = new Map<string, WorkSchedule[]>();

    for (const schedule of schedules) {
        const key = [
            schedule.workDate,
            schedule.branchId,
            schedule.workShiftId,
            schedule.startTimeSnapshot,
            schedule.endTimeSnapshot,
        ].join('|');
        const list = groups.get(key);

        if (list) list.push(schedule);
        else groups.set(key, [schedule]);
    }

    const byDate: Record<string, ShiftBlock[]> = {};

    for (const [id, list] of groups) {
        const first = list[0];
        const startMinutes = toMinutes(first.startTimeSnapshot);
        let endMinutes = toMinutes(first.endTimeSnapshot);
        const isOvernight = first.isOvernight || endMinutes <= startMinutes;

        if (isOvernight) endMinutes += 24 * 60;

        const need = Math.max(defaultStaffTarget, list.length);
        const ended =
            first.workDate < now.date ||
            (first.workDate === now.date && !isOvernight && endMinutes <= now.minutes);

        (byDate[first.workDate] ??= []).push({
            id,
            date: first.workDate,
            branchId: first.branchId,
            branchName: first.branch.name,
            workShiftId: first.workShiftId,
            shiftName: first.shiftNameSnapshot,
            shiftCode: first.shiftCodeSnapshot,
            startTime: first.startTimeSnapshot,
            endTime: first.endTimeSnapshot,
            isOvernight,
            startMinutes,
            endMinutes,
            schedules: [...list].sort((left, right) =>
                employeeName(left.employee).localeCompare(employeeName(right.employee)),
            ),
            need,
            shortage: need - list.length,
            ended,
        });
    }

    for (const blocks of Object.values(byDate)) {
        blocks.sort(
            (left, right) =>
                left.startMinutes - right.startMinutes ||
                left.branchName.localeCompare(right.branchName),
        );
    }

    return byDate;
}

export function openShortage(blocks: ShiftBlock[] = []) {
    return blocks
        .filter((block) => !block.ended)
        .reduce((total, block) => total + block.shortage, 0);
}

// Places overlapping blocks side by side; returns each block's lane and the lane count.
export function layoutLanes(blocks: ShiftBlock[]) {
    const laneEnds: number[] = [];
    const placed = blocks.map((block) => {
        let lane = laneEnds.findIndex((end) => end <= block.startMinutes);

        if (lane < 0) {
            lane = laneEnds.length;
            laneEnds.push(0);
        }

        laneEnds[lane] = block.endMinutes;
        return { block, lane };
    });

    return { placed, laneCount: Math.max(1, laneEnds.length) };
}

// Visible hour window: 06:00–24:00, widened when a shift starts earlier.
export function hourWindow(blocks: ShiftBlock[]) {
    const earliest = blocks.reduce(
        (min, block) => Math.min(min, Math.floor(block.startMinutes / 60)),
        defaultFirstHour,
    );

    return { firstHour: earliest, lastHour: defaultLastHour };
}
