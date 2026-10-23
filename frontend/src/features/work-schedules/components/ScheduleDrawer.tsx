import { type ReactNode, useState } from 'react';
import { faCheck, faChevronLeft, faChevronRight, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { SideDrawer } from '@/components/feedback';
import { useSlidingIndicator } from '@/components/layout/useSlidingIndicator';
import { type Branch } from '@/features/branches/types';
import { interpolate } from '@/features/dashboard/lib/format';
import { type Employee } from '@/features/employees/types';
import { type Position } from '@/features/positions/types';
import { type WorkShift } from '@/features/work-shifts/types';
import { useI18n } from '@/i18n';
import {
    addDays,
    employeeName,
    expandDateRange,
    formatDayMonth,
    formatDuration,
    formatTime,
    weekDays,
    weekdayKeys,
    weekdayOf,
} from '../lib/schedule-calendar';
import { type WorkSchedule, type WorkScheduleConflictStrategy } from '../types';

export type ScheduleDrawerDraft = {
    mode: 'create' | 'bulk' | 'edit';
    branchId: string;
    workShiftId: string;
    dates: string[];
    weekStart: string;
    schedule?: WorkSchedule;
};

export type ScheduleDrawerSubmit = {
    branchId: string;
    workShiftId: string;
    positionId: string;
    employeeIds: string[];
    dates: string[];
    // Set when dates come from a from–to range; the page sends it to the bulk API as is.
    range?: { startDate: string; endDate: string; weekdays: number[] };
    conflictStrategy: WorkScheduleConflictStrategy;
    note?: string;
};

type DateMode = 'pick' | 'range';

// Long ranges run one insert per employee per day on the server; keep a request bounded.
const maxRangeDays = 92;
const isoWeekdays = [1, 2, 3, 4, 5, 6, 7];

type ScheduleDrawerProps = {
    branches: Branch[];
    draft: ScheduleDrawerDraft;
    employees: Employee[];
    positions: Position[];
    today: string;
    workShifts: WorkShift[];
    onClosed: () => void;
    // Rejects to keep the drawer open; the page shows the error toast.
    onSubmit: (values: ScheduleDrawerSubmit) => Promise<void>;
};

const weekNavClass =
    'grid size-7 min-h-0 cursor-pointer place-items-center rounded-md border border-rule-strong bg-transparent text-[11px] text-ink hover:bg-stone-soft';

const dateInputClass =
    'h-10 w-full rounded-lg border border-rule-strong bg-white px-3 text-sm text-ink outline-none focus:border-ink';

const chipBase =
    'flex h-8 min-h-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium whitespace-nowrap transition-[background-color,color,border-color] duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60';

function chipTone(selected: boolean) {
    return selected
        ? 'border-ink bg-ink text-sand'
        : 'border-rule-strong bg-transparent text-ink hover:bg-stone-soft';
}

function Section({ index, title, aside, children }: {
    index: string;
    title: string;
    aside?: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-2.5 border-b border-rule-soft py-[18px] last:border-b-0">
            <div className="flex items-baseline justify-between gap-3">
                <span className="text-[11px] tracking-[0.06em] text-muted uppercase">
                    {index} · {title}
                </span>
                {aside}
            </div>
            {children}
        </div>
    );
}

// Positions every selected employee holds at the branch (the bulk API takes one).
function commonPositions(
    employeeIds: string[],
    branchId: string,
    employees: Employee[],
    positions: Position[],
) {
    if (!branchId || employeeIds.length === 0) return [];

    const activeIds = new Set(
        positions
            .filter((position) => position.branchId === branchId && position.status)
            .map((position) => position.id),
    );
    const selected = employeeIds.map((employeeId) =>
        employees.find((item) => item.id === employeeId),
    );

    if (selected.some((employee) => !employee)) return [];

    const shared = selected.reduce<Set<string>>((common, employee, index) => {
        const ids = (employee?.positions ?? [])
            .map((position) => position.id)
            .filter((id) => activeIds.has(id));

        return index === 0
            ? new Set(ids)
            : new Set(ids.filter((id) => common.has(id)));
    }, new Set());

    return positions.filter((position) => shared.has(position.id));
}

export function ScheduleDrawer({
    branches,
    draft,
    employees,
    positions,
    today,
    workShifts,
    onClosed,
    onSubmit,
}: ScheduleDrawerProps) {
    const { language, t } = useI18n();
    const editing = draft.mode === 'edit' ? draft.schedule : undefined;
    const [dateMode, setDateMode] = useState<DateMode>(
        draft.mode === 'bulk' ? 'range' : 'pick',
    );
    const [rangeStart, setRangeStart] = useState(
        draft.dates[0] ?? (draft.weekStart > today ? draft.weekStart : today),
    );
    const [rangeEnd, setRangeEnd] = useState(
        draft.dates[draft.dates.length - 1] ?? addDays(draft.weekStart, 6),
    );
    const [rangeWeekdays, setRangeWeekdays] = useState<number[]>(isoWeekdays);
    const { containerRef: modeRef, indicatorRef: modePillRef } =
        useSlidingIndicator<HTMLDivElement>('schedule-date-mode', `${dateMode}|${language}`);
    const [branchId, setBranchId] = useState(draft.branchId);
    const [workShiftId, setWorkShiftId] = useState(draft.workShiftId);
    const [weekStart, setWeekStart] = useState(draft.weekStart);
    const [dates, setDates] = useState<string[]>(draft.dates);
    const [employeeIds, setEmployeeIds] = useState<string[]>(
        editing ? [editing.employeeId] : [],
    );
    const [positionChoice, setPositionChoice] = useState(editing?.positionId ?? '');
    const [replaceExisting, setReplaceExisting] = useState(false);
    const [note, setNote] = useState(editing?.note ?? '');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const branchEmployees = editing
        ? employees.filter((employee) => employee.id === editing.employeeId)
        : employees.filter((employee) =>
              employee.branches.some((branch) => branch.id === branchId),
          );
    const positionOptions = commonPositions(employeeIds, branchId, employees, positions);
    // A single shared position is picked automatically.
    const positionId = positionOptions.some((position) => position.id === positionChoice)
        ? positionChoice
        : positionOptions.length === 1
          ? positionOptions[0].id
          : '';
    const days = weekDays(weekStart);
    const rangeValid = Boolean(rangeStart && rangeEnd) && rangeEnd >= rangeStart;
    const rangeDates = rangeValid
        ? expandDateRange(rangeStart, rangeEnd, rangeWeekdays, maxRangeDays + 1)
        : [];
    const activeDates = dateMode === 'range' ? rangeDates : dates;
    const total = employeeIds.length * activeDates.length;

    function toggleRangeWeekday(weekday: number) {
        setError('');
        setRangeWeekdays((current) =>
            current.includes(weekday)
                ? current.filter((item) => item !== weekday)
                : [...current, weekday].sort(),
        );
    }

    function validateDates() {
        if (dateMode === 'pick') {
            return dates.length === 0 ? t('workSchedules.errorDays') : '';
        }

        if (!rangeStart || !rangeEnd) return t('workSchedules.errorRangeMissing');
        if (rangeStart < today) return t('workSchedules.errorRangePast');
        if (rangeEnd < rangeStart) return t('workSchedules.errorRangeOrder');
        if (rangeDates.length > maxRangeDays) {
            return interpolate(t('workSchedules.errorRangeTooLong'), { max: maxRangeDays });
        }
        if (rangeDates.length === 0) return t('workSchedules.errorDays');

        return '';
    }

    function selectBranch(nextBranchId: string) {
        if (editing || nextBranchId === branchId) return;
        setBranchId(nextBranchId);
        setEmployeeIds([]);
        setError('');
    }

    function toggleDay(day: string) {
        setError('');
        if (editing) {
            setDates([day]);
            return;
        }

        setDates((current) =>
            current.includes(day)
                ? current.filter((item) => item !== day)
                : [...current, day].sort(),
        );
    }

    function moveWeek(step: number) {
        const next = addDays(weekStart, step * 7);
        setWeekStart(next);
        if (!editing) setDates([]);
    }

    function toggleEmployee(employeeId: string) {
        setError('');
        setEmployeeIds((current) =>
            current.includes(employeeId)
                ? current.filter((item) => item !== employeeId)
                : [...current, employeeId],
        );
    }

    async function submit(requestClose: () => void) {
        if (!branchId) return setError(t('workSchedules.errorBranch'));
        if (!workShiftId) return setError(t('workSchedules.errorShift'));
        const dateError = validateDates();
        if (dateError) return setError(dateError);
        if (employeeIds.length === 0) return setError(t('workSchedules.errorEmployees'));
        if (!positionId) return setError(t('workSchedules.errorPosition'));

        setSaving(true);

        try {
            await onSubmit({
                branchId,
                workShiftId,
                positionId,
                employeeIds,
                dates: activeDates,
                range:
                    dateMode === 'range'
                        ? { startDate: rangeStart, endDate: rangeEnd, weekdays: rangeWeekdays }
                        : undefined,
                conflictStrategy: replaceExisting ? 'REPLACE' : 'SKIP',
                note: note.trim() || undefined,
            });
            setSaving(false);
            requestClose();
        } catch {
            setSaving(false);
        }
    }

    const title = editing
        ? t('workSchedules.update')
        : draft.mode === 'bulk'
          ? t('workSchedules.bulkAssign')
          : t('workSchedules.add');

    return (
        <SideDrawer
            busy={saving}
            closeLabel={t('common.close')}
            subtitle={
                dateMode === 'range'
                    ? rangeValid
                        ? `${formatDayMonth(rangeStart)}.${rangeStart.slice(0, 4)} – ${formatDayMonth(rangeEnd)}.${rangeEnd.slice(0, 4)}`
                        : t('workSchedules.dateModeRange')
                    : interpolate(t('workSchedules.weekShort'), {
                          from: formatDayMonth(days[0]),
                          to: formatDayMonth(days[6]),
                      })
            }
            title={title}
            onClosed={onClosed}
        >
            {(requestClose) => (
                <>
                    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pt-2 pb-6 max-sm:px-4">
                        <Section index="01" title={t('workSchedules.sectionBranchShift')}>
                            <div className="flex flex-wrap gap-1.5">
                                {branches.map((branch) => (
                                    <button
                                        aria-pressed={branch.id === branchId}
                                        className={`${chipBase} ${chipTone(branch.id === branchId)} ${
                                            editing ? '' : 'cursor-pointer'
                                        }`}
                                        disabled={Boolean(editing) && branch.id !== branchId}
                                        key={branch.id}
                                        type="button"
                                        onClick={() => selectBranch(branch.id)}
                                    >
                                        {branch.name}
                                    </button>
                                ))}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                {workShifts.map((shift) => {
                                    const selected = shift.id === workShiftId;

                                    return (
                                        <button
                                            aria-pressed={selected}
                                            className={`flex min-h-0 cursor-pointer items-center justify-between gap-3 rounded-[10px] border px-3.5 py-3 text-left text-ink transition-[background-color,border-color] duration-200 ${
                                                selected
                                                    ? 'border-ink bg-[#f2efe8]'
                                                    : 'border-rule bg-transparent hover:bg-stone-soft'
                                            }`}
                                            key={shift.id}
                                            type="button"
                                            onClick={() => {
                                                setWorkShiftId(shift.id);
                                                setError('');
                                            }}
                                        >
                                            <span className="flex flex-col gap-0.5">
                                                <span className="text-sm font-semibold">{shift.name}</span>
                                                <span className="text-[11px] text-muted tabular-nums">
                                                    {formatTime(shift.startTime)}–{formatTime(shift.endTime)}
                                                    {shift.isOvernight ? ` · ${t('workSchedules.overnight')}` : ''}
                                                    {' · '}
                                                    {shift.code}
                                                </span>
                                            </span>
                                            <span className="text-xs text-muted">
                                                {formatDuration(shift.workingDurationMinutes)}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </Section>

                        <Section
                            aside={
                                dateMode === 'pick' && (
                                    <span className="flex items-center gap-1">
                                        <button
                                            aria-label={t('workSchedules.previous')}
                                            className={weekNavClass}
                                            type="button"
                                            onClick={() => moveWeek(-1)}
                                        >
                                            <FontAwesomeIcon icon={faChevronLeft} />
                                        </button>
                                        <button
                                            aria-label={t('workSchedules.next')}
                                            className={weekNavClass}
                                            type="button"
                                            onClick={() => moveWeek(1)}
                                        >
                                            <FontAwesomeIcon icon={faChevronRight} />
                                        </button>
                                    </span>
                                )
                            }
                            index="02"
                            title={t('workSchedules.sectionDays')}
                        >
                            {!editing && (
                                <div
                                    aria-label={t('workSchedules.sectionDays')}
                                    className="relative flex gap-0.5 self-start rounded-lg bg-stone p-[3px]"
                                    ref={modeRef}
                                    role="group"
                                >
                                    <span
                                        aria-hidden="true"
                                        className="pointer-events-none absolute inset-y-[3px] left-0 rounded-md bg-paper opacity-0 shadow-[0_1px_2px_rgba(23,22,15,0.12)] transition-[transform,width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
                                        ref={modePillRef}
                                    />
                                    {(['range', 'pick'] as const).map((mode) => (
                                        <button
                                            aria-pressed={dateMode === mode}
                                            className={`relative h-[30px] min-h-0 cursor-pointer rounded-md border-0 bg-transparent px-3 text-[13px] font-medium transition-colors duration-200 ${
                                                dateMode === mode ? 'text-ink' : 'text-muted hover:text-ink'
                                            }`}
                                            data-active={dateMode === mode}
                                            key={mode}
                                            type="button"
                                            onClick={() => {
                                                setDateMode(mode);
                                                setError('');
                                            }}
                                        >
                                            {mode === 'range'
                                                ? t('workSchedules.dateModeRange')
                                                : t('workSchedules.dateModePick')}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {dateMode === 'range' ? (
                                <div className="rise-enter flex flex-col gap-3" key="range">
                                    <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                                        <label className="flex flex-col gap-1.5 text-[13px] font-medium">
                                            {t('workSchedules.startDate')}
                                            <input
                                                className={dateInputClass}
                                                min={today}
                                                type="date"
                                                value={rangeStart}
                                                onChange={(event) => {
                                                    const value = event.target.value;
                                                    setRangeStart(value);
                                                    if (value && rangeEnd && rangeEnd < value) {
                                                        setRangeEnd(value);
                                                    }
                                                    setError('');
                                                }}
                                            />
                                        </label>
                                        <label className="flex flex-col gap-1.5 text-[13px] font-medium">
                                            {t('workSchedules.endDate')}
                                            <input
                                                className={dateInputClass}
                                                min={rangeStart || today}
                                                type="date"
                                                value={rangeEnd}
                                                onChange={(event) => {
                                                    setRangeEnd(event.target.value);
                                                    setError('');
                                                }}
                                            />
                                        </label>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[13px] font-medium">
                                            {t('workSchedules.weekdays')}
                                        </span>
                                        <div className="grid grid-cols-7 gap-1.5">
                                            {isoWeekdays.map((weekday) => {
                                                const selected = rangeWeekdays.includes(weekday);

                                                return (
                                                    <button
                                                        aria-pressed={selected}
                                                        className={`h-9 min-h-0 cursor-pointer rounded-lg border text-xs font-semibold transition-[background-color,color,border-color] duration-200 active:scale-[0.97] ${chipTone(selected)}`}
                                                        key={weekday}
                                                        type="button"
                                                        onClick={() => toggleRangeWeekday(weekday)}
                                                    >
                                                        {t(weekdayKeys[weekday % 7])}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <span className="text-xs text-muted">
                                        {!rangeValid
                                            ? t('workSchedules.errorRangeOrder')
                                            : rangeDates.length > maxRangeDays
                                              ? interpolate(t('workSchedules.errorRangeTooLong'), {
                                                    max: maxRangeDays,
                                                })
                                              : interpolate(t('workSchedules.rangeSummary'), {
                                                    count: rangeDates.length,
                                                })}
                                    </span>
                                </div>
                            ) : (
                                <div className="rise-enter flex flex-col gap-2.5" key="pick">
                                    <div className="rise-enter grid grid-cols-7 gap-1.5" key={weekStart}>
                                        {days.map((day) => {
                                            const selected = dates.includes(day);
                                            const locked = day < today;

                                            return (
                                                <button
                                                    aria-pressed={selected}
                                                    className={`flex h-[52px] min-h-0 flex-col items-center justify-center gap-0.5 rounded-lg border text-[11px] transition-[background-color,color,border-color] duration-200 ${
                                                        selected
                                                            ? 'border-ink bg-ink text-sand'
                                                            : locked
                                                              ? 'cursor-not-allowed border-stone-soft bg-stone-soft text-[#b9b3a4]'
                                                              : 'cursor-pointer border-rule-strong bg-transparent text-ink hover:bg-stone-soft'
                                                    }`}
                                                    disabled={locked}
                                                    key={day}
                                                    type="button"
                                                    onClick={() => toggleDay(day)}
                                                >
                                                    <span className="font-semibold">{t(weekdayKeys[weekdayOf(day)])}</span>
                                                    <span className="text-[15px] font-semibold tabular-nums">
                                                        {Number(day.slice(8, 10))}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <span className="text-xs text-muted">{t('workSchedules.daysHint')}</span>
                                </div>
                            )}
                            {!editing && (
                                <label className="flex cursor-pointer items-center gap-2 text-[13px]">
                                    <input
                                        checked={replaceExisting}
                                        className="size-4 accent-[var(--color-ink)]"
                                        type="checkbox"
                                        onChange={(event) => setReplaceExisting(event.target.checked)}
                                    />
                                    {t('workSchedules.replaceUnlocked')}
                                </label>
                            )}
                        </Section>

                        <Section
                            aside={
                                <span className="text-xs text-muted">
                                    {interpolate(t('workSchedules.selectedEmployees'), {
                                        count: employeeIds.length,
                                    })}
                                </span>
                            }
                            index="03"
                            title={t('workSchedules.sectionEmployees')}
                        >
                            {branchId ? (
                                <div className="flex max-h-56 flex-wrap gap-1.5 overflow-y-auto">
                                    {branchEmployees.map((employee) => {
                                        const selected = employeeIds.includes(employee.id);

                                        return (
                                            <button
                                                aria-pressed={selected}
                                                className={`${chipBase} ${chipTone(selected)} ${
                                                    editing ? '' : 'cursor-pointer'
                                                }`}
                                                disabled={Boolean(editing)}
                                                key={employee.id}
                                                title={employee.employeeCode}
                                                type="button"
                                                onClick={() => toggleEmployee(employee.id)}
                                            >
                                                <FontAwesomeIcon
                                                    className="text-[10px]"
                                                    icon={selected ? faCheck : faPlus}
                                                />
                                                {employeeName(employee)}
                                            </button>
                                        );
                                    })}
                                    {branchEmployees.length === 0 && (
                                        <span className="text-[13px] text-muted">
                                            {t('workSchedules.noEmployeesInBranch')}
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <span className="text-[13px] text-muted">
                                    {t('workSchedules.selectBranchFirst')}
                                </span>
                            )}
                            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5 pt-2">
                                <label className="flex flex-col gap-1.5 text-[13px] font-medium">
                                    {t('workSchedules.position')}
                                    <select
                                        className="h-10 w-full cursor-pointer rounded-lg border border-rule-strong bg-white px-2.5 text-sm text-ink outline-none focus:border-ink disabled:cursor-not-allowed disabled:bg-stone-soft disabled:text-muted"
                                        disabled={positionOptions.length === 0}
                                        value={positionId}
                                        onChange={(event) => {
                                            setPositionChoice(event.target.value);
                                            setError('');
                                        }}
                                    >
                                        <option value="">
                                            {employeeIds.length
                                                ? positionOptions.length
                                                    ? t('workSchedules.selectPosition')
                                                    : t('workSchedules.noCommonPosition')
                                                : t('workSchedules.selectEmployeeFirst')}
                                        </option>
                                        {positionOptions.map((position) => (
                                            <option key={position.id} value={position.id}>
                                                {position.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="flex flex-col gap-1.5 text-[13px] font-medium">
                                    {t('workSchedules.note')}
                                    <input
                                        className="h-10 w-full rounded-lg border border-rule-strong bg-white px-3 text-sm text-ink outline-none placeholder:text-faint focus:border-ink"
                                        maxLength={1000}
                                        placeholder={t('workSchedules.notePlaceholder')}
                                        value={note}
                                        onChange={(event) => setNote(event.target.value)}
                                    />
                                </label>
                            </div>
                        </Section>

                        {error && (
                            <span className="rise-enter text-[13px] text-ember-strong" role="alert">
                                {error}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-rule px-6 py-4 max-sm:px-4">
                        <span className="flex-1 text-xs text-muted">
                            {total > 0 &&
                                interpolate(t('workSchedules.formSummary'), {
                                    people: employeeIds.length,
                                    days: dates.length,
                                    total,
                                })}
                        </span>
                        <button
                            className="h-[38px] min-h-0 cursor-pointer rounded-lg border border-rule-strong bg-transparent px-4 text-[13px] font-medium text-ink transition-colors hover:bg-stone-soft disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={saving}
                            type="button"
                            onClick={requestClose}
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            className="h-[38px] min-h-0 cursor-pointer rounded-lg border-0 bg-ink px-4 text-[13px] font-medium text-sand transition-colors hover:bg-ink-soft disabled:cursor-wait disabled:opacity-70"
                            disabled={saving}
                            type="button"
                            onClick={() => void submit(requestClose)}
                        >
                            {saving ? t('common.loadingSave') : t('workSchedules.saveSchedule')}
                        </button>
                    </div>
                </>
            )}
        </SideDrawer>
    );
}
