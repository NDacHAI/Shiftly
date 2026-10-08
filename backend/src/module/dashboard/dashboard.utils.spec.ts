import {
    addDaysToDateString,
    buildDateRange,
    daysBetween,
    monthRangeOf,
    toNumber,
    toVietnamDateTime,
    vietnamToday,
} from './dashboard.utils';

describe('dashboard utils', () => {
    it('returns the Vietnam date even when UTC is still on the previous day', () => {
        expect(vietnamToday(new Date('2026-10-08T18:30:00.000Z'))).toBe(
            '2026-10-09',
        );
        expect(vietnamToday(new Date('2026-10-08T16:59:00.000Z'))).toBe(
            '2026-10-08',
        );
    });

    it('adds days across month and year boundaries', () => {
        expect(addDaysToDateString('2026-01-31', 1)).toBe('2026-02-01');
        expect(addDaysToDateString('2026-01-01', -1)).toBe('2025-12-31');
    });

    it('builds an inclusive date range', () => {
        expect(buildDateRange('2026-02-27', '2026-03-02')).toEqual([
            '2026-02-27',
            '2026-02-28',
            '2026-03-01',
            '2026-03-02',
        ]);
        expect(buildDateRange('2026-03-02', '2026-03-01')).toEqual([]);
    });

    it('counts days between two dates', () => {
        expect(daysBetween('2026-10-09', '2026-10-31')).toBe(22);
        expect(daysBetween('2026-10-09', '2026-10-01')).toBe(-8);
    });

    it('returns the month range including leap years', () => {
        expect(monthRangeOf('2028-02-15')).toEqual({
            startDate: '2028-02-01',
            endDate: '2028-02-29',
        });
    });

    it('converts a Vietnam local time to the UTC instant', () => {
        expect(toVietnamDateTime('2026-10-09', '08:00:00').toISOString()).toBe(
            '2026-10-09T01:00:00.000Z',
        );
    });

    it('converts raw SQL aggregates to numbers', () => {
        expect(toNumber('125.50')).toBe(125.5);
        expect(toNumber(null)).toBe(0);
        expect(toNumber('abc')).toBe(0);
    });
});
