import { interpolate } from '@/features/dashboard/lib/format';
import { useI18n } from '@/i18n';
import {
    mondayFirstWeekdayKeys,
    openShortage,
    type ShiftBlock,
} from '../lib/schedule-calendar';

type ScheduleMonthGridProps = {
    blocksByDate: Record<string, ShiftBlock[]>;
    days: string[];
    month: string;
    selectedDate: string;
    showStaffing: boolean;
    today: string;
    onOpenDay: (date: string) => void;
};

export function ScheduleMonthGrid({
    blocksByDate,
    days,
    month,
    selectedDate,
    showStaffing,
    today,
    onOpenDay,
}: ScheduleMonthGridProps) {
    const { t } = useI18n();

    return (
        <div className="overflow-x-auto">
            <div className="grid min-w-[640px] grid-cols-7">
                {mondayFirstWeekdayKeys.map((key) => (
                    <span
                        className="border-b border-rule px-3 py-2.5 text-[11px] font-semibold tracking-[0.04em] text-muted"
                        key={key}
                    >
                        {t(key)}
                    </span>
                ))}
                {days.map((day) => {
                    const blocks = blocksByDate[day] ?? [];
                    const inMonth = day.slice(0, 7) === month;
                    const shortage = showStaffing && inMonth ? openShortage(blocks) : 0;
                    const people = blocks.reduce(
                        (total, block) => total + block.schedules.length,
                        0,
                    );

                    return (
                        <button
                            className={`flex min-h-24 cursor-pointer flex-col gap-1.5 border-0 border-r border-b border-rule-soft px-3 py-2.5 text-left transition-colors duration-200 hover:bg-[#f6f4ef] ${
                                day === selectedDate ? 'bg-[#f2efe8]' : 'bg-transparent'
                            }`}
                            key={day}
                            type="button"
                            onClick={() => onOpenDay(day)}
                        >
                            <span
                                className={`-mt-1 -ml-1.5 grid size-[26px] place-items-center rounded-full text-sm font-semibold tabular-nums ${
                                    day === today
                                        ? 'bg-ember text-ink'
                                        : inMonth
                                          ? 'text-ink'
                                          : 'text-[#b9b3a4]'
                                }`}
                            >
                                {Number(day.slice(8, 10))}
                            </span>
                            <span className={`text-xs ${inMonth ? 'text-muted' : 'text-[#b9b3a4]'}`}>
                                {blocks.length
                                    ? interpolate(t('workSchedules.monthCellCount'), {
                                          shifts: blocks.length,
                                          people,
                                      })
                                    : '—'}
                            </span>
                            {shortage > 0 && (
                                <span className="text-[11px] font-semibold text-ember-strong">
                                    {interpolate(t('workSchedules.shortPeople'), { count: shortage })}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
