import { faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { initialsOf, interpolate } from '@/features/dashboard/lib/format';
import { useI18n } from '@/i18n';
import {
    employeeName,
    formatDuration,
    formatLongDate,
    formatTime,
    formatWeekdayLong,
    type ShiftBlock,
} from '../lib/schedule-calendar';
import { type WorkSchedule } from '../types';

type ScheduleDayPanelProps = {
    blocks: ShiftBlock[];
    canManage: boolean;
    date: string;
    locale: string;
    openBlockId: string | null;
    search: string;
    today: string;
    onDelete: (schedule: WorkSchedule) => void;
    onEdit: (schedule: WorkSchedule) => void;
    onFill: (block: ShiftBlock) => void;
    onToggleBlock: (blockId: string) => void;
};

function Stat({ label, value, tone = 'text-ink', divided = false }: {
    label: string;
    value: number | string;
    tone?: string;
    divided?: boolean;
}) {
    return (
        <div className={`flex flex-col gap-0.5 ${divided ? 'border-l border-rule pl-3.5' : ''}`}>
            <span className={`text-2xl font-semibold tracking-[-0.03em] tabular-nums ${tone}`}>
                {value}
            </span>
            <span className="text-xs text-muted">{label}</span>
        </div>
    );
}

export function ScheduleDayPanel({
    blocks,
    canManage,
    date,
    locale,
    openBlockId,
    search,
    today,
    onDelete,
    onEdit,
    onFill,
    onToggleBlock,
}: ScheduleDayPanelProps) {
    const { t } = useI18n();
    const query = search.trim().toLowerCase();
    const people = blocks.reduce((total, block) => total + block.schedules.length, 0);
    const workedMinutes = blocks.reduce(
        (total, block) =>
            total +
            block.schedules.reduce(
                (sum, schedule) => sum + schedule.workingDurationMinutes,
                0,
            ),
        0,
    );

    return (
        <aside className="flex min-w-[300px] flex-[0_1_360px] flex-col overflow-hidden rounded-[14px] border border-rule bg-paper lg:sticky lg:top-[120px] max-sm:min-w-0">
            <div className="rise-enter flex flex-col gap-3.5 border-b border-rule px-[22px] py-5" key={date}>
                <div className="flex flex-col gap-1">
                    <span className="text-[11px] tracking-[0.06em] text-muted uppercase">
                        {formatWeekdayLong(date, locale)}
                        {date === today ? ` · ${t('workSchedules.today')}` : ''}
                    </span>
                    <h2 className="text-[22px] font-semibold tracking-[-0.02em]">
                        {formatLongDate(date, locale)}
                    </h2>
                </div>
                <div className="grid grid-cols-3">
                    <Stat label={t('workSchedules.statShifts')} value={blocks.length} />
                    <Stat divided label={t('workSchedules.statPeople')} value={people} />
                    <Stat
                        divided
                        label={t('workSchedules.statHours')}
                        value={formatDuration(workedMinutes)}
                    />
                </div>
            </div>

            <div className="flex max-h-[560px] flex-col overflow-y-auto">
                {blocks.map((block) => {
                    const open = openBlockId === block.id;
                    const count = block.schedules.length;
                    const tag = block.ended
                        ? { label: t('workSchedules.tagDone'), className: 'bg-stone text-muted' }
                        : {
                              label: canManage
                                  ? interpolate(t('workSchedules.peopleCount'), { count })
                                  : t('workSchedules.tagUpcoming'),
                              className: 'bg-[#dff0e4] text-[#1f6237]',
                          };

                    return (
                        <div
                            className={`border-b border-rule-soft transition-colors duration-200 ${
                                open ? 'bg-[#f6f4ef]' : ''
                            }`}
                            key={block.id}
                        >
                            <button
                                aria-expanded={open}
                                className="grid w-full min-h-0 cursor-pointer grid-cols-[64px_minmax(0,1fr)_auto] items-start gap-3 border-0 bg-transparent px-[22px] py-3.5 text-left text-ink"
                                type="button"
                                onClick={() => onToggleBlock(block.id)}
                            >
                                <span className="flex flex-col text-xs leading-normal tabular-nums">
                                    <span className="font-medium">{formatTime(block.startTime)}</span>
                                    <span className="text-faint">{formatTime(block.endTime)}</span>
                                </span>
                                <span className="flex min-w-0 flex-col gap-1.5">
                                    <span className="flex flex-col gap-px">
                                        <span className="text-sm font-semibold">{block.shiftName}</span>
                                        <span className="text-xs text-muted">{block.branchName}</span>
                                    </span>
                                    <span className="flex items-center">
                                        {block.schedules.slice(0, 5).map((schedule) => (
                                            <span
                                                className="-mr-1.5 grid size-6 place-items-center rounded-full border-2 border-paper bg-stone text-[9px] font-semibold"
                                                key={schedule.id}
                                            >
                                                {initialsOf(employeeName(schedule.employee))}
                                            </span>
                                        ))}
                                        {count > 5 && (
                                            <span className="pl-3 text-[11px] text-muted">
                                                +{count - 5}
                                            </span>
                                        )}
                                    </span>
                                </span>
                                <span
                                    className={`rounded px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${tag.className}`}
                                >
                                    {tag.label}
                                </span>
                            </button>

                            {open && (
                                <div className="rise-enter flex flex-col gap-1 pr-[22px] pb-4 pl-[98px]">
                                    {block.schedules.map((schedule) => {
                                        const name = employeeName(schedule.employee);
                                        const hit =
                                            Boolean(query) &&
                                            `${name} ${schedule.employee.employeeCode}`
                                                .toLowerCase()
                                                .includes(query);

                                        return (
                                            <div
                                                className="group flex items-center gap-2 text-[13px]"
                                                key={schedule.id}
                                            >
                                                <span
                                                    className={`size-1.5 flex-none rounded-full ${
                                                        hit ? 'bg-ember' : 'bg-[#b9b3a4]'
                                                    }`}
                                                />
                                                <span className="flex min-w-0 flex-1 flex-col py-1">
                                                    <span className={`truncate ${hit ? 'font-semibold' : ''}`}>
                                                        {name}
                                                    </span>
                                                    <span className="truncate text-[11px] text-muted">
                                                        {schedule.employee.employeeCode} · {schedule.position.name}
                                                        {schedule.note ? ` · ${schedule.note}` : ''}
                                                    </span>
                                                </span>
                                                {canManage && !block.ended && (
                                                    <span className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                                                        <button
                                                            aria-label={t('common.edit')}
                                                            className="grid size-7 min-h-0 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-[11px] text-muted hover:bg-stone hover:text-ink"
                                                            title={t('common.edit')}
                                                            type="button"
                                                            onClick={() => onEdit(schedule)}
                                                        >
                                                            <FontAwesomeIcon icon={faPen} />
                                                        </button>
                                                        <button
                                                            aria-label={t('common.delete')}
                                                            className="grid size-7 min-h-0 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-[11px] text-muted hover:bg-ember-tint hover:text-ember-strong"
                                                            title={t('common.delete')}
                                                            type="button"
                                                            onClick={() => onDelete(schedule)}
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} />
                                                        </button>
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {canManage && !block.ended && (
                                        <button
                                            className="mt-1.5 h-[30px] min-h-0 cursor-pointer self-start rounded-md border-0 bg-ink px-3 text-xs font-medium text-sand transition-colors hover:bg-ink-soft"
                                            type="button"
                                            onClick={() => onFill(block)}
                                        >
                                            {t('workSchedules.fillMore')}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}

                {blocks.length === 0 && (
                    <div className="flex flex-col items-center gap-1.5 px-[22px] py-12 text-center">
                        <span className="text-[15px] font-semibold">
                            {t('workSchedules.noShiftsTitle')}
                        </span>
                        <span className="text-[13px] text-muted">
                            {canManage
                                ? t('workSchedules.noShiftsDescription')
                                : t('workSchedules.noShiftsMine')}
                        </span>
                    </div>
                )}
            </div>
        </aside>
    );
}
