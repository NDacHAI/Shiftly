const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function vietnamToday(now: Date = new Date()): string {
    return new Date(now.getTime() + VIETNAM_OFFSET_MS)
        .toISOString()
        .slice(0, 10);
}

export function addDaysToDateString(date: string, days: number): string {
    const [year, month, day] = date.split('-').map(Number);
    const value = new Date(Date.UTC(year, month - 1, day));
    value.setUTCDate(value.getUTCDate() + days);

    return value.toISOString().slice(0, 10);
}

export function buildDateRange(fromDate: string, toDate: string): string[] {
    const dates: string[] = [];
    let current = fromDate;

    while (current <= toDate) {
        dates.push(current);
        current = addDaysToDateString(current, 1);
    }

    return dates;
}

export function daysBetween(fromDate: string, toDate: string): number {
    const [fromYear, fromMonth, fromDay] = fromDate.split('-').map(Number);
    const [toYear, toMonth, toDay] = toDate.split('-').map(Number);

    return Math.round(
        (Date.UTC(toYear, toMonth - 1, toDay) -
            Date.UTC(fromYear, fromMonth - 1, fromDay)) /
            DAY_MS,
    );
}

export function monthRangeOf(date: string): { startDate: string; endDate: string } {
    const [year, month] = date.split('-').map(Number);
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const monthText = String(month).padStart(2, '0');

    return {
        startDate: `${year}-${monthText}-01`,
        endDate: `${year}-${monthText}-${String(lastDay).padStart(2, '0')}`,
    };
}

export function toVietnamDateTime(date: string, time: string): Date {
    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute, second = 0] = time.split(':').map(Number);

    return new Date(Date.UTC(year, month - 1, day, hour - 7, minute, second, 0));
}

export function toNumber(value: unknown): number {
    const result = Number(value ?? 0);

    return Number.isFinite(result) ? result : 0;
}
