import { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faPlus, faSearch } from '@fortawesome/free-solid-svg-icons';
import { ConfirmDialog, useToast } from '@/components/feedback';
import { useSlidingIndicator } from '@/components/layout/useSlidingIndicator';
import { roles, type Role } from '@/constants/roles';
import { listBranches } from '@/features/branches/api/branches.api';
import { type Branch } from '@/features/branches/types';
import { interpolate } from '@/features/dashboard/lib/format';
import { listEmployees } from '@/features/employees/api/employees.api';
import { type Employee } from '@/features/employees/types';
import { listPositions } from '@/features/positions/api/positions.api';
import { type Position } from '@/features/positions/types';
import { listWorkShifts } from '@/features/work-shifts/api/work-shift.api';
import { type WorkShift, WorkShiftStatus } from '@/features/work-shifts/types';
import { useI18n } from '@/i18n';
import {
    bulkCreateWorkSchedules,
    createWorkSchedule,
    deleteWorkSchedule,
    getWorkScheduleErrorKey,
    listMyWorkSchedules,
    listWorkSchedules,
    type ListWorkSchedulesParams,
    updateWorkSchedule,
} from '../api/work-schedules.api';
import {
    ScheduleDrawer,
    type ScheduleDrawerDraft,
    type ScheduleDrawerSubmit,
} from '../components/ScheduleDrawer';
import { ScheduleDayPanel } from '../components/ScheduleDayPanel';
import { ScheduleMonthGrid } from '../components/ScheduleMonthGrid';
import { ScheduleTimeGrid } from '../components/ScheduleTimeGrid';
import {
    buildShiftBlocks,
    employeeName,
    formatRangeLabel,
    getViewRange,
    isoWeekdayOf,
    monthGridDays,
    moveAnchorDate,
    type ShiftBlock,
    startOfMonth,
    startOfWeek,
    vietnamNow,
    weekDays,
} from '../lib/schedule-calendar';
import { type WorkSchedule, type WorkScheduleViewMode } from '../types';

// The API caps a page at 100 rows; the calendar fetches every page of the range.
const pageSize = 100;
const allBranches = 'all';

const viewModes: Array<{ value: WorkScheduleViewMode; labelKey: 'workSchedules.day' | 'workSchedules.week' | 'workSchedules.month' }> = [
    { value: 'day', labelKey: 'workSchedules.day' },
    { value: 'week', labelKey: 'workSchedules.week' },
    { value: 'month', labelKey: 'workSchedules.month' },
];

type Motion = 'rise-enter' | 'slide-next' | 'slide-prev';

type WorkSchedulesPageProps = {
    userRole: Role;
};

async function fetchAllSchedules(
    params: Omit<ListWorkSchedulesParams, 'page' | 'limit'>,
    mine: boolean,
) {
    const load = mine ? listMyWorkSchedules : listWorkSchedules;
    const first = await load({ ...params, page: 1, limit: pageSize });
    const rest = await Promise.all(
        Array.from({ length: Math.max(0, first.meta.totalPages - 1) }, (_, index) =>
            load({ ...params, page: index + 2, limit: pageSize }),
        ),
    );

    return [first, ...rest].flatMap((response) => response.data);
}

const navButtonClass =
    'grid size-[34px] min-h-0 cursor-pointer place-items-center rounded-lg border border-rule-strong bg-transparent text-xs text-ink transition-colors hover:bg-stone-soft';

export function WorkSchedulesPage({ userRole }: WorkSchedulesPageProps) {
    const canManage = userRole === roles.admin || userRole === roles.manager;
    const { showToast } = useToast();
    const { language, t } = useI18n();
    const locale = language === 'vi' ? 'vi-VN' : 'en-US';
    const [now, setNow] = useState(vietnamNow);
    const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
    const [viewMode, setViewMode] = useState<WorkScheduleViewMode>('week');
    const [anchorDate, setAnchorDate] = useState(now.date);
    const [selectedDate, setSelectedDate] = useState(now.date);
    const [branchFilter, setBranchFilter] = useState(allBranches);
    const [search, setSearch] = useState('');
    const [openBlockId, setOpenBlockId] = useState<string | null>(null);
    const [motion, setMotion] = useState<Motion>('rise-enter');
    const [loading, setLoading] = useState(true);
    const [reloadKey, setReloadKey] = useState(0);
    const [draft, setDraft] = useState<ScheduleDrawerDraft | null>(null);
    const [scheduleToDelete, setScheduleToDelete] = useState<WorkSchedule | null>(null);
    const [deleting, setDeleting] = useState(false);
    const { containerRef: viewRef, indicatorRef: viewPillRef } =
        useSlidingIndicator<HTMLDivElement>('schedule-view', `${viewMode}|${language}`);
    const viewRange = useMemo(() => getViewRange(anchorDate, viewMode), [anchorDate, viewMode]);

    // Keeps "ended" shifts and the now-line current.
    useEffect(() => {
        const intervalId = window.setInterval(() => setNow(vietnamNow()), 60_000);
        return () => window.clearInterval(intervalId);
    }, []);

    useEffect(() => {
        if (!canManage) return;

        let cancelled = false;

        Promise.all([
            listBranches({ page: 1, limit: 100, sortBy: 'name', sortOrder: 'ASC' }),
            listPositions({ page: 1, limit: 100, status: true, sortBy: 'name', sortOrder: 'ASC' }),
            listEmployees({
                page: 1,
                limit: 100,
                status: 'Active',
                sortBy: 'employeeCode',
                sortOrder: 'ASC',
            }),
            listWorkShifts({ page: 1, limit: 100, status: WorkShiftStatus.Active }),
        ])
            .then(([branchResponse, positionResponse, employeeResponse, shiftResponse]) => {
                if (cancelled) return;
                setBranches(branchResponse.data.filter((branch) => branch.status));
                setPositions(positionResponse.data.filter((position) => position.status));
                setEmployees(employeeResponse.data);
                setWorkShifts(
                    [...shiftResponse.data].sort((left, right) =>
                        left.startTime.localeCompare(right.startTime),
                    ),
                );
            })
            .catch((error) => {
                if (cancelled) return;
                showToast({
                    title: t('workSchedules.filtersLoadError'),
                    message: t(getWorkScheduleErrorKey(error)),
                    variant: 'error',
                });
            });

        return () => {
            cancelled = true;
        };
    }, [canManage, showToast, t]);

    useEffect(() => {
        let cancelled = false;

        fetchAllSchedules(
            {
                ...viewRange,
                branchId: branchFilter === allBranches ? undefined : branchFilter,
                sortBy: 'workDate',
                sortOrder: 'ASC',
            },
            !canManage,
        )
            .then((data) => {
                if (!cancelled) setSchedules(data);
            })
            .catch((error) => {
                if (cancelled) return;
                showToast({
                    title: t('workSchedules.loadError'),
                    message: t(getWorkScheduleErrorKey(error)),
                    variant: 'error',
                });
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [branchFilter, canManage, reloadKey, showToast, t, viewRange]);

    const blocksByDate = useMemo(() => buildShiftBlocks(schedules, now), [schedules, now]);
    const selectedBlocks = blocksByDate[selectedDate] ?? [];
    const reload = useCallback(() => {
        setLoading(true);
        setReloadKey((key) => key + 1);
    }, []);

    function changeRange(nextAnchor: string, nextMotion: Motion) {
        const nextRange = getViewRange(nextAnchor, viewMode);

        // Same range means no refetch, so only flag loading when it changes.
        if (nextRange.fromDate !== viewRange.fromDate) {
            setMotion(nextMotion);
            setLoading(true);
        }
        setAnchorDate(nextAnchor);
        setSelectedDate(nextAnchor);
        setOpenBlockId(null);
    }

    function step(direction: 1 | -1) {
        const nextAnchor = moveAnchorDate(anchorDate, viewMode, direction);
        changeRange(
            viewMode === 'month' ? startOfMonth(nextAnchor) : nextAnchor,
            direction > 0 ? 'slide-next' : 'slide-prev',
        );
    }

    function changeView(nextView: WorkScheduleViewMode) {
        if (nextView === viewMode) return;
        setMotion('rise-enter');
        setLoading(true);
        setViewMode(nextView);
        setAnchorDate(selectedDate);
    }

    function changeBranch(nextBranch: string) {
        if (nextBranch === branchFilter) return;
        setMotion('rise-enter');
        setLoading(true);
        setBranchFilter(nextBranch);
        setOpenBlockId(null);
    }

    function defaultBranchId() {
        return branchFilter === allBranches ? (branches[0]?.id ?? '') : branchFilter;
    }

    function openCreate(bulk: boolean) {
        // A past week would open with every day locked, so fall back to this week.
        const weekStart = startOfWeek(selectedDate >= now.date ? selectedDate : now.date);
        const upcoming = weekDays(weekStart).filter((day) => day >= now.date);

        setDraft({
            mode: bulk ? 'bulk' : 'create',
            branchId: defaultBranchId(),
            workShiftId: '',
            dates: bulk ? upcoming : selectedDate >= now.date ? [selectedDate] : [],
            weekStart,
        });
    }

    function openFill(block: ShiftBlock) {
        setDraft({
            mode: 'create',
            branchId: block.branchId,
            workShiftId: block.workShiftId,
            dates: [block.date],
            weekStart: startOfWeek(block.date),
        });
    }

    function openEdit(schedule: WorkSchedule) {
        setDraft({
            mode: 'edit',
            branchId: schedule.branchId,
            workShiftId: schedule.workShiftId,
            dates: [schedule.workDate],
            weekStart: startOfWeek(schedule.workDate),
            schedule,
        });
    }

    async function handleSubmit(values: ScheduleDrawerSubmit) {
        const editing = draft?.mode === 'edit' ? draft.schedule : undefined;

        try {
            if (editing) {
                await updateWorkSchedule(editing.id, {
                    branchId: values.branchId,
                    positionId: values.positionId,
                    workShiftId: values.workShiftId,
                    workDate: values.dates[0],
                    note: values.note,
                });
                showToast({ message: t('workSchedules.updated'), variant: 'success' });
            } else if (
                !values.range &&
                values.employeeIds.length === 1 &&
                values.dates.length === 1
            ) {
                await createWorkSchedule({
                    employeeId: values.employeeIds[0],
                    branchId: values.branchId,
                    positionId: values.positionId,
                    workShiftId: values.workShiftId,
                    workDate: values.dates[0],
                    note: values.note,
                });
                showToast({ message: t('workSchedules.created'), variant: 'success' });
            } else {
                // Picked dates sit inside one week, so first..last plus their weekdays is exactly the set.
                const range = values.range ?? {
                    startDate: values.dates[0],
                    endDate: values.dates[values.dates.length - 1],
                    weekdays: values.dates.map(isoWeekdayOf),
                };
                const result = await bulkCreateWorkSchedules({
                    employeeIds: values.employeeIds,
                    branchId: values.branchId,
                    positionId: values.positionId,
                    workShiftId: values.workShiftId,
                    ...range,
                    conflictStrategy: values.conflictStrategy,
                    note: values.note,
                });
                showToast({
                    title: t('workSchedules.bulkFinished'),
                    message: interpolate(t('workSchedules.bulkSummary'), {
                        created: result.createdCount,
                        replaced: result.replacedCount,
                        skipped: result.skippedCount,
                        failed: result.failedCount,
                    }),
                    variant: result.failedCount ? 'info' : 'success',
                });
            }

            reload();
        } catch (error) {
            showToast({
                title: editing ? t('workSchedules.saveError') : t('workSchedules.bulkError'),
                message: t(getWorkScheduleErrorKey(error)),
                variant: 'error',
            });
            throw error;
        }
    }

    async function handleDelete() {
        if (!scheduleToDelete) return;
        setDeleting(true);

        try {
            await deleteWorkSchedule(scheduleToDelete.id);
            setScheduleToDelete(null);
            reload();
            showToast({ message: t('workSchedules.deleted'), variant: 'success' });
        } catch (error) {
            showToast({
                title: t('workSchedules.deleteError'),
                message: t(getWorkScheduleErrorKey(error)),
                variant: 'error',
            });
        } finally {
            setDeleting(false);
        }
    }

    const branchChips = [
        { id: allBranches, name: t('workSchedules.allBranchesShort') },
        ...branches,
    ];
    const gridDays =
        viewMode === 'day'
            ? [anchorDate]
            : viewMode === 'week'
              ? weekDays(anchorDate)
              : monthGridDays(anchorDate);

    return (
        <section className="bg-sand text-ink">
            <div className="mx-auto flex w-full max-w-[1520px] flex-col gap-5 p-8 max-sm:p-4">
                <div className="flex flex-wrap items-end justify-between gap-5">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs tracking-[0.04em] text-muted uppercase">
                            {t('workSchedules.eyebrow')}
                        </span>
                        <h1 className="text-[34px] leading-tight font-semibold tracking-[-0.03em] max-sm:text-[28px]">
                            {t('workSchedules.title')}
                        </h1>
                        <p className="text-[15px] text-muted">
                            {canManage
                                ? t('workSchedules.headlineManage')
                                : t('workSchedules.headlineMine')}
                        </p>
                    </div>
                    {canManage && (
                        <div className="flex flex-none gap-2">
                            <button
                                className="h-[38px] min-h-0 cursor-pointer rounded-lg border border-rule-strong bg-paper px-3.5 text-[13px] font-medium whitespace-nowrap text-ink transition-colors hover:bg-stone-soft"
                                type="button"
                                onClick={() => openCreate(true)}
                            >
                                {t('workSchedules.bulkAssign')}
                            </button>
                            <button
                                className="flex h-[38px] min-h-0 cursor-pointer items-center gap-2 rounded-lg border-0 bg-ink px-4 text-[13px] font-medium whitespace-nowrap text-sand transition-colors hover:bg-ink-soft"
                                type="button"
                                onClick={() => openCreate(false)}
                            >
                                <FontAwesomeIcon icon={faPlus} />
                                {t('workSchedules.add')}
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-start gap-5">
                    <section className="flex min-w-0 flex-[1_1_720px] flex-col overflow-hidden rounded-[14px] border border-rule bg-paper">
                        <div className="flex flex-wrap items-center gap-2.5 border-b border-rule px-5 py-4 max-sm:px-4">
                            <div className="flex items-center gap-1">
                                <button
                                    aria-label={t('workSchedules.previous')}
                                    className={navButtonClass}
                                    type="button"
                                    onClick={() => step(-1)}
                                >
                                    <FontAwesomeIcon icon={faChevronLeft} />
                                </button>
                                <button
                                    aria-label={t('workSchedules.next')}
                                    className={navButtonClass}
                                    type="button"
                                    onClick={() => step(1)}
                                >
                                    <FontAwesomeIcon icon={faChevronRight} />
                                </button>
                            </div>
                            <span className="px-1.5 text-[17px] font-semibold tracking-[-0.01em] whitespace-nowrap tabular-nums">
                                {formatRangeLabel(anchorDate, viewMode, locale)}
                            </span>
                            <button
                                className={`h-[34px] min-h-0 cursor-pointer rounded-lg border border-rule-strong bg-transparent px-3 text-[13px] font-medium whitespace-nowrap transition-colors hover:bg-stone-soft ${
                                    selectedDate === now.date ? 'text-faint' : 'text-ink'
                                }`}
                                type="button"
                                onClick={() =>
                                    changeRange(
                                        viewMode === 'month' ? startOfMonth(now.date) : now.date,
                                        now.date < anchorDate ? 'slide-prev' : 'slide-next',
                                    )
                                }
                            >
                                {t('workSchedules.today')}
                            </button>
                            <div className="flex-1" />
                            <div
                                aria-label={t('workSchedules.viewMode')}
                                className="relative flex gap-0.5 rounded-lg bg-stone p-[3px]"
                                ref={viewRef}
                                role="group"
                            >
                                <span
                                    aria-hidden="true"
                                    className="pointer-events-none absolute inset-y-[3px] left-0 rounded-md bg-paper opacity-0 shadow-[0_1px_2px_rgba(23,22,15,0.12)] transition-[transform,width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
                                    ref={viewPillRef}
                                />
                                {viewModes.map((mode) => {
                                    const active = viewMode === mode.value;

                                    return (
                                        <button
                                            aria-pressed={active}
                                            className={`relative h-[30px] min-h-0 cursor-pointer rounded-md border-0 bg-transparent px-3 text-[13px] font-medium transition-colors duration-200 ${
                                                active ? 'text-ink' : 'text-muted hover:text-ink'
                                            }`}
                                            data-active={active}
                                            key={mode.value}
                                            type="button"
                                            onClick={() => changeView(mode.value)}
                                        >
                                            {t(mode.labelKey)}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 border-b border-rule px-5 py-3 max-sm:px-4">
                            {canManage && (
                                <div className="flex flex-wrap gap-1.5">
                                    {branchChips.map((branch) => {
                                        const active = branch.id === branchFilter;

                                        return (
                                            <button
                                                aria-pressed={active}
                                                className={`h-[30px] min-h-0 cursor-pointer rounded-full border px-3 text-xs font-medium whitespace-nowrap transition-[background-color,color,border-color] duration-200 active:scale-[0.97] ${
                                                    active
                                                        ? 'border-ink bg-ink text-sand'
                                                        : 'border-rule-strong bg-transparent text-ink hover:bg-stone-soft'
                                                }`}
                                                key={branch.id}
                                                type="button"
                                                onClick={() => changeBranch(branch.id)}
                                            >
                                                {branch.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                            <div className="flex-1" />
                            <label className="flex h-[34px] min-w-[180px] flex-[0_1_280px] items-center gap-2.5 rounded-lg border border-rule-strong bg-white px-3 transition-colors focus-within:border-ink">
                                <FontAwesomeIcon className="text-[11px] text-muted" icon={faSearch} />
                                <input
                                    aria-label={t('common.search')}
                                    className="min-w-0 flex-1 border-0 bg-transparent text-[13px] text-ink outline-none placeholder:text-faint"
                                    placeholder={t('workSchedules.searchPlaceholder')}
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                />
                            </label>
                        </div>

                        <div className="relative overflow-hidden">
                            <div
                                className={`${motion} transition-opacity duration-200 ${
                                    loading ? 'opacity-60' : 'opacity-100'
                                }`}
                                key={`${viewMode}|${viewRange.fromDate}|${branchFilter}`}
                            >
                                {viewMode === 'month' ? (
                                    <ScheduleMonthGrid
                                        blocksByDate={blocksByDate}
                                        days={gridDays}
                                        month={anchorDate.slice(0, 7)}
                                        selectedDate={selectedDate}
                                        today={now.date}
                                        onOpenDay={(date) => {
                                            setMotion('rise-enter');
                                            setLoading(true);
                                            setViewMode('day');
                                            setAnchorDate(date);
                                            setSelectedDate(date);
                                            setOpenBlockId(null);
                                        }}
                                    />
                                ) : (
                                    <ScheduleTimeGrid
                                        blocksByDate={blocksByDate}
                                        days={gridDays}
                                        now={now}
                                        openBlockId={openBlockId}
                                        search={search}
                                        selectedDate={selectedDate}
                                        showBranch={branchFilter === allBranches}
                                        onPickBlock={(block) => {
                                            setSelectedDate(block.date);
                                            setOpenBlockId(block.id);
                                        }}
                                        onSelectDate={(date) => {
                                            setSelectedDate(date);
                                            setOpenBlockId(null);
                                        }}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-[18px] border-t border-rule px-5 py-3 text-xs text-muted max-sm:px-4">
                            <span className="flex items-center gap-1.5">
                                <span className="size-2.5 rounded-[3px] bg-ink" />
                                {t('workSchedules.tagUpcoming')}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="size-2.5 rounded-[3px] bg-stone" />
                                {t('workSchedules.statusEnded')}
                            </span>
                        </div>
                    </section>

                    <ScheduleDayPanel
                        blocks={selectedBlocks}
                        canManage={canManage}
                        date={selectedDate}
                        locale={locale}
                        openBlockId={openBlockId}
                        search={search}
                        today={now.date}
                        onDelete={setScheduleToDelete}
                        onEdit={openEdit}
                        onFill={openFill}
                        onToggleBlock={(blockId) =>
                            setOpenBlockId((current) => (current === blockId ? null : blockId))
                        }
                    />
                </div>
            </div>

            {draft && (
                <ScheduleDrawer
                    branches={branches}
                    draft={draft}
                    employees={employees}
                    positions={positions}
                    today={now.date}
                    workShifts={workShifts}
                    onClosed={() => setDraft(null)}
                    onSubmit={handleSubmit}
                />
            )}

            <ConfirmDialog
                cancelLabel={t('common.cancel')}
                confirmLabel={t('workSchedules.deleteConfirmLabel')}
                description={interpolate(t('workSchedules.deleteDescription'), {
                    name: scheduleToDelete ? employeeName(scheduleToDelete.employee) : '',
                })}
                loading={deleting}
                open={Boolean(scheduleToDelete)}
                title={t('common.confirmDelete')}
                tone="danger"
                onCancel={() => setScheduleToDelete(null)}
                onConfirm={() => void handleDelete()}
            />
        </section>
    );
}
