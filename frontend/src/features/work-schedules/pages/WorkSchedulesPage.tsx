import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Calendar, dateFnsLocalizer, type EventProps, type View } from 'react-big-calendar';
import { format as formatDateFns, getDay, parse, startOfWeek as startOfWeekDateFns } from 'date-fns';
import { enUS, vi } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
    faCalendarCheck,
    faChevronLeft,
    faChevronRight,
    faEllipsisVertical,
    faEye,
    faFilter,
    faLayerGroup,
    faPen,
    faPlus,
    faRotateRight,
    faSearch,
    faTrash,
    faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { ConfirmDialog, useToast } from '@/components/feedback';
import { Button, EmptyState, LoadingOverlay } from '@/components/ui';
import { roles, type Role } from '@/constants/roles';
import { listBranches } from '@/features/branches/api/branches.api';
import { type Branch } from '@/features/branches/types';
import { listEmployees } from '@/features/employees/api/employees.api';
import { type Employee } from '@/features/employees/types';
import { listPositions } from '@/features/positions/api/positions.api';
import { type Position } from '@/features/positions/types';
import { listWorkShifts } from '@/features/work-shifts/api/work-shift.api';
import { type WorkShift, WorkShiftStatus } from '@/features/work-shifts/types';
import { useDebounce } from '@/hooks/useDebounce';
import { useI18n } from '@/i18n';
import {
    bulkCreateWorkSchedules,
    createWorkSchedule,
    deleteWorkSchedule,
    getWorkScheduleErrorMessage,
    listMyWorkSchedules,
    listWorkSchedules,
    updateWorkSchedule,
} from '../api/work-schedules.api';
import {
    type BulkWorkSchedulePayload,
    type UpdateWorkSchedulePayload,
    type WorkSchedule,
    type WorkSchedulePayload,
    type WorkScheduleViewMode,
} from '../types';

const pageSize = 100;
const fieldClass =
    'min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500';

type WorkSchedulesPageProps = {
    userRole: Role;
};

type ScheduleFormValues = {
    employeeId: string;
    branchId: string;
    positionId: string;
    workShiftId: string;
    workDate: string;
    note: string;
};

type BulkFormValues = {
    employeeIds: string[];
    branchId: string;
    positionId: string;
    workShiftId: string;
    startDate: string;
    endDate: string;
    weekdays: number[];
    conflictStrategy: 'SKIP' | 'REPLACE';
    note: string;
};

type ScheduleOperationalStatus =
    | 'enough'
    | 'understaffed'
    | 'pending'
    | 'conflict'
    | 'cancelled';

type ScheduleGroupSummary = {
    key: string;
    shiftCode: string;
    shiftName: string;
    positionName: string;
    startTime: string;
    endTime: string;
    count: number;
    target: number;
    status: ScheduleOperationalStatus;
    schedules: WorkSchedule[];
};

type WorkScheduleCalendarEvent = {
    id: string;
    title: string;
    start: Date;
    end: Date;
    resource:
        | {
              kind: 'group';
              date: string;
              group: ScheduleGroupSummary;
          }
        | {
              kind: 'schedule';
              date: string;
              schedule: WorkSchedule;
              status: ScheduleOperationalStatus;
          };
};

const defaultStaffTarget = 4;
const calendarLocales = {
    en: enUS,
    vi,
};
const calendarLocalizer = dateFnsLocalizer({
    format: formatDateFns,
    getDay,
    locales: calendarLocales,
    parse,
    startOfWeek: startOfWeekDateFns,
});

function today() {
    return new Date().toISOString().slice(0, 10);
}

function toDate(value: string) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
}

function toCalendarDate(value: string) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function toCalendarDateTime(date: string, time: string) {
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes);
}

function fromDate(value: Date) {
    return value.toISOString().slice(0, 10);
}

function fromCalendarDate(value: Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function addDays(value: string, days: number) {
    const date = toDate(value);
    date.setUTCDate(date.getUTCDate() + days);
    return fromDate(date);
}

function startOfWeek(value: string) {
    const date = toDate(value);
    const day = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() - day + 1);
    return fromDate(date);
}

function startOfMonth(value: string) {
    const date = toDate(value);
    date.setUTCDate(1);
    return fromDate(date);
}

function endOfMonth(value: string) {
    const date = toDate(value);
    date.setUTCMonth(date.getUTCMonth() + 1, 0);
    return fromDate(date);
}

function getViewRange(anchorDate: string, viewMode: WorkScheduleViewMode) {
    if (viewMode === 'day') {
        return { fromDate: anchorDate, toDate: anchorDate };
    }

    if (viewMode === 'week') {
        const fromDate = startOfWeek(anchorDate);
        return { fromDate, toDate: addDays(fromDate, 6) };
    }

    return {
        fromDate: startOfMonth(anchorDate),
        toDate: endOfMonth(anchorDate),
    };
}

function moveAnchorDate(anchorDate: string, viewMode: WorkScheduleViewMode, step: number) {
    if (viewMode === 'day') return addDays(anchorDate, step);
    if (viewMode === 'week') return addDays(anchorDate, step * 7);

    const date = toDate(anchorDate);
    date.setUTCMonth(date.getUTCMonth() + step);
    return fromDate(date);
}

function formatDate(value: string, locale = 'vi-VN') {
    return new Intl.DateTimeFormat(locale, {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
    }).format(toDate(value));
}

function formatLongDate(value: string, locale = 'vi-VN') {
    return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(toDate(value));
}

function formatNumericDate(value: string, locale = 'vi-VN') {
    return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(toDate(value));
}

function formatTime(value: string) {
    return value.slice(0, 5);
}

function formatEmployee(employee: Employee) {
    return `${employee.employeeCode} - ${employee.firstName} ${employee.lastName}`;
}

function employeeBelongsToBranch(employee: Employee, branchId: string) {
    return employee.branches.some((branch) => branch.id === branchId);
}

function getAssignablePositions(
    employeeIds: string[],
    branchId: string,
    employees: Employee[],
    positions: Position[],
) {
    if (!branchId || employeeIds.length === 0) return [];

    const selectedEmployees = employeeIds
        .map((employeeId) => employees.find((employee) => employee.id === employeeId))
        .filter((employee): employee is Employee => Boolean(employee));

    if (selectedEmployees.length !== employeeIds.length) return [];

    const activePositionIds = new Set(
        positions
            .filter((position) => position.branchId === branchId && position.status)
            .map((position) => position.id),
    );
    const allowedPositionIds = selectedEmployees.reduce<Set<string> | null>(
        (commonIds, employee) => {
            const employeePositionIds = new Set(
                employee.positions
                    .filter(
                        (position) =>
                            position.branchId === branchId &&
                            activePositionIds.has(position.id),
                    )
                    .map((position) => position.id),
            );

            if (!commonIds) return employeePositionIds;

            return new Set(
                [...commonIds].filter((positionId) =>
                    employeePositionIds.has(positionId),
                ),
            );
        },
        null,
    );

    return positions.filter((position) => allowedPositionIds?.has(position.id));
}

function formatDuration(minutes: number) {
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    if (!hours) return `${remainder}m`;
    if (!remainder) return `${hours}h`;
    return `${hours}h ${remainder}m`;
}

function getScheduleDateRange(schedule: WorkSchedule) {
    const start = toCalendarDateTime(schedule.workDate, schedule.startTimeSnapshot);
    const end = toCalendarDateTime(schedule.workDate, schedule.endTimeSnapshot);

    if (schedule.isOvernight || end <= start) {
        end.setDate(end.getDate() + 1);
    }

    return { end, start };
}

function getScheduleSignal(schedule: WorkSchedule): ScheduleOperationalStatus | null {
    const note = schedule.note?.toLowerCase() ?? '';

    if (note.includes('cancel') || note.includes('hủy') || note.includes('huy')) {
        return 'cancelled';
    }

    if (note.includes('conflict') || note.includes('xung đột') || note.includes('xung dot')) {
        return 'conflict';
    }

    if (note.includes('pending') || note.includes('chờ') || note.includes('cho')) {
        return 'pending';
    }

    return null;
}

function getGroupStatus(count: number, schedules: WorkSchedule[]): ScheduleOperationalStatus {
    const scheduleSignal = schedules
        .map(getScheduleSignal)
        .find((status): status is ScheduleOperationalStatus => Boolean(status));

    if (scheduleSignal) return scheduleSignal;
    return count >= defaultStaffTarget ? 'enough' : 'understaffed';
}

function groupSchedulesForDay(schedules: WorkSchedule[]): ScheduleGroupSummary[] {
    const groups = schedules.reduce<Record<string, WorkSchedule[]>>((accumulator, schedule) => {
        const key = [
            schedule.workShiftId,
            schedule.positionId,
            schedule.startTimeSnapshot,
            schedule.endTimeSnapshot,
        ].join('|');

        accumulator[key] ??= [];
        accumulator[key].push(schedule);
        return accumulator;
    }, {});

    return Object.entries(groups)
        .map(([key, groupSchedules]) => {
            const first = groupSchedules[0];
            const target = Math.max(defaultStaffTarget, groupSchedules.length);

            return {
                key,
                shiftCode: first.shiftCodeSnapshot,
                shiftName: first.shiftNameSnapshot,
                positionName: first.position.name,
                startTime: first.startTimeSnapshot,
                endTime: first.endTimeSnapshot,
                count: groupSchedules.length,
                target,
                status: getGroupStatus(groupSchedules.length, groupSchedules),
                schedules: groupSchedules,
            };
        })
        .sort((left, right) => left.startTime.localeCompare(right.startTime));
}

function getScheduleStatus(
    schedule: WorkSchedule,
    daySchedules: WorkSchedule[],
): ScheduleOperationalStatus {
    const signal = getScheduleSignal(schedule);
    if (signal) return signal;

    const group = groupSchedulesForDay(daySchedules).find((item) =>
        item.schedules.some((groupSchedule) => groupSchedule.id === schedule.id),
    );

    return group?.status ?? 'enough';
}

function buildCalendarEvents(
    schedulesByDate: Record<string, WorkSchedule[]>,
    viewMode: WorkScheduleViewMode,
): WorkScheduleCalendarEvent[] {
    if (viewMode === 'month') {
        return Object.entries(schedulesByDate).flatMap(([date, daySchedules]) =>
            groupSchedulesForDay(daySchedules).map((group) => ({
                id: `group:${date}:${group.key}`,
                title: `${group.shiftCode} / ${group.positionName}`,
                start: toCalendarDateTime(date, group.startTime),
                end: toCalendarDateTime(date, group.endTime),
                resource: {
                    kind: 'group',
                    date,
                    group,
                },
            })),
        );
    }

    return Object.entries(schedulesByDate).flatMap(([date, daySchedules]) =>
        daySchedules.map((schedule) => {
            const { end, start } = getScheduleDateRange(schedule);
            return {
                id: schedule.id,
                title: `${schedule.employee.employeeCode} / ${schedule.shiftCodeSnapshot}`,
                start,
                end,
                resource: {
                    kind: 'schedule',
                    date,
                    schedule,
                    status: getScheduleStatus(schedule, daySchedules),
                },
            };
        }),
    );
}

function buildMonthDays(anchorDate: string) {
    const monthStart = startOfMonth(anchorDate);
    const gridStart = startOfWeek(monthStart);

    return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

function buildViewDays(anchorDate: string, viewMode: WorkScheduleViewMode) {
    if (viewMode === 'day') return [anchorDate];
    if (viewMode === 'week') {
        const weekStart = startOfWeek(anchorDate);
        return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
    }

    return buildMonthDays(anchorDate);
}

function getInitialScheduleValues(schedule: WorkSchedule | null): ScheduleFormValues {
    return {
        employeeId: schedule?.employeeId ?? '',
        branchId: schedule?.branchId ?? '',
        positionId: schedule?.positionId ?? '',
        workShiftId: schedule?.workShiftId ?? '',
        workDate: schedule?.workDate ?? today(),
        note: schedule?.note ?? '',
    };
}

function getInitialBulkValues(): BulkFormValues {
    return {
        employeeIds: [],
        branchId: '',
        positionId: '',
        workShiftId: '',
        startDate: today(),
        endDate: today(),
        weekdays: [1, 2, 3, 4, 5],
        conflictStrategy: 'SKIP',
        note: '',
    };
}

function interpolate(
    template: string,
    values: Record<string, string | number>,
) {
    return Object.entries(values).reduce(
        (result, [key, value]) => result.replace(`{${key}}`, String(value)),
        template,
    );
}

export function WorkSchedulesPage({ userRole }: WorkSchedulesPageProps) {
    const canManage = userRole === roles.admin || userRole === roles.manager;
    const { showToast } = useToast();
    const { language, t } = useI18n();
    const locale = language === 'vi' ? 'vi-VN' : 'en-US';
    const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
    const [viewMode, setViewMode] = useState<WorkScheduleViewMode>('week');
    const [anchorDate, setAnchorDate] = useState(today());
    const [selectedDate, setSelectedDate] = useState(today());
    const [search, setSearch] = useState('');
    const [branchFilter, setBranchFilter] = useState('all');
    const [positionFilter, setPositionFilter] = useState('all');
    const [employeeFilter, setEmployeeFilter] = useState('all');
    const [workShiftFilter, setWorkShiftFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [showBulkForm, setShowBulkForm] = useState(false);
    const [editing, setEditing] = useState<WorkSchedule | null>(null);
    const [selected, setSelected] = useState<WorkSchedule | null>(null);
    const [scheduleToDelete, setScheduleToDelete] = useState<WorkSchedule | null>(null);
    const [deleting, setDeleting] = useState(false);
    const debouncedSearch = useDebounce(search);

    const viewRange = useMemo(
        () => getViewRange(anchorDate, viewMode),
        [anchorDate, viewMode],
    );

    const filteredPositions = useMemo(
        () =>
            positions.filter(
                (position) =>
                    branchFilter === 'all' || position.branchId === branchFilter,
            ),
        [branchFilter, positions],
    );

    const filteredEmployees = useMemo(
        () =>
            employees.filter(
                (employee) =>
                    branchFilter === 'all' ||
                    employeeBelongsToBranch(employee, branchFilter),
            ),
        [branchFilter, employees],
    );

    const selectedDaySchedules = useMemo(
        () =>
            schedules
                .filter((schedule) => schedule.workDate === selectedDate)
                .sort((left, right) =>
                    left.startTimeSnapshot.localeCompare(right.startTimeSnapshot),
                ),
        [schedules, selectedDate],
    );

    const activeFilterCount = [
        branchFilter,
        positionFilter,
        employeeFilter,
        workShiftFilter,
    ].filter((value) => value !== 'all').length;

    const periodLabel = useMemo(() => {
        if (viewMode === 'day') return formatLongDate(anchorDate, locale);
        if (viewMode === 'week') {
            return `${formatLongDate(viewRange.fromDate, locale)} - ${formatLongDate(viewRange.toDate, locale)}`;
        }

        return new Intl.DateTimeFormat(locale, {
            month: 'long',
            year: 'numeric',
        }).format(toDate(anchorDate));
    }, [anchorDate, locale, viewMode, viewRange]);

    const selectedDayTitle = `${t('workSchedules.selectedDayTitle')} ${formatNumericDate(selectedDate, locale)}`;

    const loadFilters = useCallback(async () => {
        if (!canManage) return;

        const [branchResponse, positionResponse, employeeResponse, shiftResponse] =
            await Promise.all([
                listBranches({
                    page: 1,
                    limit: 100,
                    sortBy: 'name',
                    sortOrder: 'ASC',
                }),
                listPositions({
                    page: 1,
                    limit: 100,
                    status: true,
                    sortBy: 'name',
                    sortOrder: 'ASC',
                }),
                listEmployees({
                    page: 1,
                    limit: 100,
                    status: 'Active',
                    sortBy: 'employeeCode',
                    sortOrder: 'ASC',
                }),
                listWorkShifts({
                    page: 1,
                    limit: 100,
                    status: WorkShiftStatus.Active,
                }),
            ]);

        setBranches(branchResponse.data.filter((branch) => branch.status));
        setPositions(positionResponse.data.filter((position) => position.status));
        setEmployees(employeeResponse.data);
        setWorkShifts(shiftResponse.data);
    }, [canManage]);

    const loadSchedules = useCallback(async () => {
        setLoading(true);

        try {
            const params = {
                page: 1,
                limit: pageSize,
                ...viewRange,
                search: debouncedSearch.trim() || undefined,
                branchId: branchFilter === 'all' ? undefined : branchFilter,
                positionId: positionFilter === 'all' ? undefined : positionFilter,
                employeeId: employeeFilter === 'all' ? undefined : employeeFilter,
                workShiftId: workShiftFilter === 'all' ? undefined : workShiftFilter,
                sortBy: 'workDate' as const,
                sortOrder: 'ASC' as const,
            };
            const response = canManage
                ? await listWorkSchedules(params)
                : await listMyWorkSchedules(params);

            setSchedules(response.data);
        } catch (error) {
            showToast({
                title: t('workSchedules.loadError'),
                message: getWorkScheduleErrorMessage(error),
                variant: 'error',
            });
        } finally {
            setLoading(false);
        }
    }, [
        branchFilter,
        canManage,
        debouncedSearch,
        employeeFilter,
        positionFilter,
        showToast,
        viewRange,
        workShiftFilter,
    ]);

    useEffect(() => {
        void loadFilters().catch((error) => {
            showToast({
                title: t('workSchedules.filtersLoadError'),
                message: getWorkScheduleErrorMessage(error),
                variant: 'error',
            });
        });
    }, [loadFilters, showToast, t]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadSchedules();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [loadSchedules]);

    async function handleSave(payload: WorkSchedulePayload | UpdateWorkSchedulePayload) {
        setSaving(true);

        try {
            if (editing) {
                await updateWorkSchedule(editing.id, payload as UpdateWorkSchedulePayload);
            } else {
                await createWorkSchedule(payload as WorkSchedulePayload);
            }

            setShowForm(false);
            setEditing(null);
            await loadSchedules();
            showToast({
                title: t('common.success'),
                message: editing
                    ? t('workSchedules.updated')
                    : t('workSchedules.created'),
                variant: 'success',
            });
        } catch (error) {
            showToast({
                title: t('workSchedules.saveError'),
                message: getWorkScheduleErrorMessage(error),
                variant: 'error',
            });
        } finally {
            setSaving(false);
        }
    }

    async function handleBulkSave(payload: BulkWorkSchedulePayload) {
        setSaving(true);

        try {
            const result = await bulkCreateWorkSchedules(payload);
            setShowBulkForm(false);
            await loadSchedules();
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
        } catch (error) {
            showToast({
                title: t('workSchedules.bulkError'),
                message: getWorkScheduleErrorMessage(error),
                variant: 'error',
            });
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!scheduleToDelete) return;
        setDeleting(true);

        try {
            await deleteWorkSchedule(scheduleToDelete.id);
            setScheduleToDelete(null);
            await loadSchedules();
            showToast({
                title: t('common.success'),
                message: t('workSchedules.deleted'),
                variant: 'success',
            });
        } catch (error) {
            showToast({
                title: t('workSchedules.deleteError'),
                message: getWorkScheduleErrorMessage(error),
                variant: 'error',
            });
        } finally {
            setDeleting(false);
        }
    }

    function openCreateForm(date = selectedDate) {
        setEditing(null);
        setSelectedDate(date);
        setAnchorDate(date);
        setShowForm(true);
    }

    function clearFilters() {
        setBranchFilter('all');
        setPositionFilter('all');
        setEmployeeFilter('all');
        setWorkShiftFilter('all');
        setSearch('');
    }

    const schedulesByDate = schedules.reduce<Record<string, WorkSchedule[]>>(
        (accumulator, schedule) => {
            accumulator[schedule.workDate] ??= [];
            accumulator[schedule.workDate].push(schedule);
            return accumulator;
        },
        {},
    );

    return (
        <section className="mx-auto grid max-w-[1500px] gap-5 p-6 max-sm:p-4">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm max-md:items-stretch max-md:flex-col">
                <div className="flex items-center gap-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xl text-primary-600">
                        <FontAwesomeIcon icon={faCalendarCheck} />
                    </span>
                    <div>
                        <h2 className="text-xl font-bold text-slate-950">
                            {t('workSchedules.title')}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {t('workSchedules.subtitle')}
                        </p>
                    </div>
                </div>
                {canManage && (
                    <div className="flex gap-3 max-sm:flex-col">
                        <Button onClick={() => setShowBulkForm(true)} size="lg" variant="secondary">
                            <FontAwesomeIcon icon={faLayerGroup} />
                            {t('workSchedules.bulkAssign')}
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-5 max-xl:grid-cols-1">
                <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <LoadingOverlay label={t('workSchedules.loading')} visible={loading} />
                    <div className="grid gap-3 border-b border-slate-200 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    aria-label={t('workSchedules.previous')}
                                    onClick={() =>
                                        setAnchorDate((current) =>
                                            moveAnchorDate(current, viewMode, -1),
                                        )
                                    }
                                    size="icon"
                                    variant="secondary"
                                >
                                    <FontAwesomeIcon icon={faChevronLeft} />
                                </Button>
                                <button
                                    className="min-h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 hover:border-primary-200 hover:text-primary-700"
                                    onClick={() => setAnchorDate(selectedDate)}
                                    type="button"
                                >
                                    {interpolate(t('workSchedules.currentPeriod'), {
                                        mode: t(`workSchedules.${viewMode}`),
                                        range: periodLabel,
                                    })}
                                </button>
                                <Button
                                    aria-label={t('workSchedules.next')}
                                    onClick={() =>
                                        setAnchorDate((current) =>
                                            moveAnchorDate(current, viewMode, 1),
                                        )
                                    }
                                    size="icon"
                                    variant="secondary"
                                >
                                    <FontAwesomeIcon icon={faChevronRight} />
                                </Button>
                                <Button
                                    onClick={() => {
                                        const currentToday = today();
                                        setAnchorDate(currentToday);
                                        setSelectedDate(currentToday);
                                    }}
                                    variant="secondary"
                                >
                                    {t('workSchedules.today')}
                                </Button>
                            </div>

                            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                                {(['day', 'week', 'month'] as const).map((mode) => (
                                    <button
                                        className={`min-h-9 rounded-md px-3 text-sm font-semibold capitalize transition ${
                                            viewMode === mode
                                                ? 'bg-white text-primary-700 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-900'
                                        }`}
                                        key={mode}
                                        onClick={() => setViewMode(mode)}
                                        type="button"
                                    >
                                        {t(`workSchedules.${mode}`)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <label className="relative min-w-64 flex-1">
                            <FontAwesomeIcon
                                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
                                icon={faSearch}
                            />
                            <input
                                className={`${fieldClass} pl-9`}
                                placeholder={t('workSchedules.searchPlaceholder')}
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                            />
                            </label>
                            {canManage && (
                                <Button
                                    onClick={() => setShowFilters((current) => !current)}
                                    variant={showFilters ? 'primary' : 'secondary'}
                                >
                                    <FontAwesomeIcon icon={faFilter} />
                                    {showFilters
                                        ? t('workSchedules.hideFilters')
                                        : `${t('workSchedules.filterToggle')}${activeFilterCount ? ` ${activeFilterCount}` : ''}`}
                                </Button>
                            )}
                            <Button onClick={() => void loadSchedules()} variant="secondary">
                                <FontAwesomeIcon icon={faRotateRight} />
                                {t('common.refresh')}
                            </Button>
                            {canManage && (
                                <Button onClick={() => openCreateForm()} size="lg">
                                    <FontAwesomeIcon icon={faPlus} />
                                    {t('workSchedules.add')}
                                </Button>
                            )}
                        </div>
                    </div>

                    {canManage && showFilters && (
                        <div className="grid grid-cols-[repeat(4,minmax(0,1fr))_auto] gap-3 border-b border-slate-200 bg-slate-50/70 p-4 max-xl:grid-cols-2 max-sm:grid-cols-1">
                            <NativeSelect
                                label={t('workSchedules.branch')}
                                value={branchFilter}
                                onChange={(value) => {
                                    setBranchFilter(value);
                                    setPositionFilter('all');
                                    setEmployeeFilter('all');
                                }}
                                options={[
                                    { value: 'all', label: t('workSchedules.allBranches') },
                                    ...branches.map((branch) => ({
                                        value: branch.id,
                                        label: branch.name,
                                    })),
                                ]}
                            />
                            <NativeSelect
                                label={t('workSchedules.position')}
                                value={positionFilter}
                                onChange={setPositionFilter}
                                options={[
                                    { value: 'all', label: t('workSchedules.allPositions') },
                                    ...filteredPositions.map((position) => ({
                                        value: position.id,
                                        label: position.name,
                                    })),
                                ]}
                            />
                            <NativeSelect
                                label={t('workSchedules.employee')}
                                value={employeeFilter}
                                onChange={setEmployeeFilter}
                                options={[
                                    { value: 'all', label: t('workSchedules.allEmployees') },
                                    ...filteredEmployees.map((employee) => ({
                                        value: employee.id,
                                        label: formatEmployee(employee),
                                    })),
                                ]}
                            />
                            <NativeSelect
                                label={t('workSchedules.shift')}
                                value={workShiftFilter}
                                onChange={setWorkShiftFilter}
                                options={[
                                    { value: 'all', label: t('workSchedules.allShifts') },
                                    ...workShifts.map((shift) => ({
                                        value: shift.id,
                                        label: `${shift.code} - ${shift.name}`,
                                    })),
                                ]}
                            />
                            <div className="flex items-end">
                                <Button
                                    className="w-full"
                                    onClick={clearFilters}
                                    variant="secondary"
                                >
                                    {t('workSchedules.clearFilters')}
                                </Button>
                            </div>
                        </div>
                    )}

                    <ScheduleCalendar
                        anchorDate={anchorDate}
                        canManage={canManage}
                        locale={locale}
                        schedulesByDate={schedulesByDate}
                        viewMode={viewMode}
                        onCreate={openCreateForm}
                        onNavigateDate={(date) => setAnchorDate(date)}
                        onSelectDate={setSelectedDate}
                        onSelect={setSelected}
                    />
                </div>

                <aside className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-5 py-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-primary-600">
                            {t('workSchedules.date')}
                        </p>
                        <h3 className="mt-1 text-lg font-bold text-slate-950">
                            {selectedDayTitle}
                        </h3>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                            {interpolate(t('workSchedules.selectedDayCount'), {
                                count: selectedDaySchedules.length,
                            })}{' '}
                            {' / '}
                            {interpolate(t('workSchedules.selectedDayPeople'), {
                                count: new Set(
                                    selectedDaySchedules.map(
                                        (schedule) => schedule.employeeId,
                                    ),
                                ).size,
                            })}
                        </p>
                    </div>
                    <div className="max-h-[760px] overflow-y-auto">
                        {selectedDaySchedules.length === 0 && !loading ? (
                            <EmptyState
                                description={t('workSchedules.noResultsDescription')}
                                icon={<FontAwesomeIcon icon={faCalendarCheck} />}
                                title={t('workSchedules.noResultsTitle')}
                            />
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {selectedDaySchedules.map((schedule) => (
                                    <ScheduleListItem
                                        canManage={canManage}
                                        daySchedules={selectedDaySchedules}
                                        key={schedule.id}
                                        locale={locale}
                                        schedule={schedule}
                                        onDelete={setScheduleToDelete}
                                        onEdit={(value) => {
                                            setEditing(value);
                                            setShowForm(true);
                                        }}
                                        onView={setSelected}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </aside>
            </div>

            {showForm && (
                <ScheduleFormDialog
                    branches={branches}
                    editing={editing}
                    employees={employees}
                    positions={positions}
                    saving={saving}
                    workShifts={workShifts}
                    onClose={() => {
                        setShowForm(false);
                        setEditing(null);
                    }}
                    onSubmit={handleSave}
                />
            )}

            {showBulkForm && (
                <BulkAssignDialog
                    branches={branches}
                    employees={employees}
                    positions={positions}
                    saving={saving}
                    workShifts={workShifts}
                    onClose={() => setShowBulkForm(false)}
                    onSubmit={handleBulkSave}
                />
            )}

            {selected && (
                <ScheduleDetailsDialog
                    locale={locale}
                    schedule={selected}
                    onClose={() => setSelected(null)}
                />
            )}

            <ConfirmDialog
                confirmLabel={t('workSchedules.deleteConfirmLabel')}
                description={interpolate(t('workSchedules.deleteDescription'), {
                    name: scheduleToDelete?.employee
                        ? formatEmployee(scheduleToDelete.employee)
                        : '',
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

type SelectOption = {
    value: string;
    label: string;
};

function NativeSelect({
    label,
    options,
    value,
    onChange,
}: {
    label: string;
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
            {label}
            <select
                className={fieldClass}
                value={value}
                onChange={(event) => onChange(event.target.value)}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    );
}

function ScheduleCalendar({
    anchorDate,
    canManage,
    locale,
    schedulesByDate,
    viewMode,
    onCreate,
    onNavigateDate,
    onSelectDate,
    onSelect,
}: {
    anchorDate: string;
    canManage: boolean;
    locale: string;
    schedulesByDate: Record<string, WorkSchedule[]>;
    viewMode: WorkScheduleViewMode;
    onCreate: (date: string) => void;
    onNavigateDate: (date: string) => void;
    onSelectDate: (date: string) => void;
    onSelect: (schedule: WorkSchedule) => void;
}) {
    const { t } = useI18n();
    const calendarEvents = useMemo(
        () => buildCalendarEvents(schedulesByDate, viewMode),
        [schedulesByDate, viewMode],
    );
    const culture = locale === 'vi-VN' ? 'vi' : 'en';

    return (
        <div className="work-schedule-calendar min-h-[640px] bg-white p-3">
            <Calendar<WorkScheduleCalendarEvent>
                culture={culture}
                date={toCalendarDate(anchorDate)}
                endAccessor={(event) => event.end}
                eventPropGetter={(event) => ({
                    className: `work-schedule-calendar__event work-schedule-calendar__event--${event.resource.kind === 'group' ? event.resource.group.status : event.resource.status}`,
                })}
                events={calendarEvents}
                formats={{
                    dayFormat: (date) => formatDate(fromCalendarDate(date), locale),
                    dayHeaderFormat: (date) => formatDate(fromCalendarDate(date), locale),
                    weekdayFormat: (date) =>
                        new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date),
                }}
                localizer={calendarLocalizer}
                messages={{
                    date: t('workSchedules.date'),
                    day: t('workSchedules.day'),
                    month: t('workSchedules.month'),
                    next: t('workSchedules.next'),
                    previous: t('workSchedules.previous'),
                    showMore: (count) =>
                        interpolate(t('workSchedules.moreShifts'), { count }),
                    today: t('workSchedules.today'),
                    week: t('workSchedules.week'),
                }}
                popup
                selectable
                startAccessor={(event) => event.start}
                step={30}
                timeslots={2}
                toolbar={false}
                view={viewMode as View}
                views={['month', 'week', 'day']}
                components={{
                    event: CalendarEvent,
                }}
                onDoubleClickEvent={(event) => {
                    if (event.resource.kind === 'group') {
                        onCreate(event.resource.date);
                        return;
                    }

                    onSelect(event.resource.schedule);
                }}
                onNavigate={(date) => onNavigateDate(fromCalendarDate(date))}
                onSelectEvent={(event) => {
                    onSelectDate(event.resource.date);
                    if (event.resource.kind === 'schedule') {
                        onSelect(event.resource.schedule);
                    }
                }}
                onSelectSlot={(slot) => {
                    const day = fromCalendarDate(slot.start);
                    onSelectDate(day);
                    if (viewMode !== 'month' && canManage) {
                        onCreate(day);
                    }
                }}
                onView={() => undefined}
            />
        </div>
    );
}

function CalendarEvent({ event }: EventProps<WorkScheduleCalendarEvent>) {
    const { t } = useI18n();

    if (event.resource.kind === 'group') {
        const { group } = event.resource;

        return (
            <div className="work-schedule-calendar__event-content">
                <div className="flex min-w-0 items-center justify-between gap-1">
                    <span className="truncate font-bold">
                        {group.shiftCode} / {formatTime(group.startTime)}-{formatTime(group.endTime)}
                    </span>
                    <StatusBadge status={group.status} compact />
                </div>
                <div className="mt-0.5 flex min-w-0 items-center justify-between gap-1 text-[11px] font-semibold opacity-80">
                    <span className="truncate">{group.positionName}</span>
                    <span>
                        {interpolate(t('workSchedules.shiftSummaryCount'), {
                            count: group.count,
                            target: group.target,
                        })}
                    </span>
                </div>
            </div>
        );
    }

    const { schedule } = event.resource;

    return (
        <div className="work-schedule-calendar__event-content">
            <div className="truncate font-bold">
                {formatTime(schedule.startTimeSnapshot)} - {formatTime(schedule.endTimeSnapshot)}
            </div>
            <div className="mt-0.5 truncate text-[11px] font-semibold opacity-80">
                {schedule.employee.employeeCode} / {schedule.shiftCodeSnapshot}
            </div>
        </div>
    );
}

function ScheduleListItem({
    canManage,
    daySchedules,
    locale,
    schedule,
    onDelete,
    onEdit,
    onView,
}: {
    canManage: boolean;
    daySchedules: WorkSchedule[];
    locale: string;
    schedule: WorkSchedule;
    onDelete: (schedule: WorkSchedule) => void;
    onEdit: (schedule: WorkSchedule) => void;
    onView: (schedule: WorkSchedule) => void;
}) {
    const { t } = useI18n();
    const status = getScheduleStatus(schedule, daySchedules);

    return (
        <article
            className="grid cursor-pointer gap-3 p-4 hover:bg-slate-50"
            onClick={() => onView(schedule)}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-base font-bold text-slate-950">
                        {schedule.employee.firstName} {schedule.employee.lastName}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                        {schedule.employee.employeeCode} / {schedule.position.name}
                    </p>
                </div>
                <StatusBadge status={status} />
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <strong className="block text-base text-slate-950">
                            {schedule.shiftNameSnapshot}
                        </strong>
                        <span className="mt-1 block text-sm font-semibold text-slate-500">
                            {schedule.shiftCodeSnapshot} / {schedule.branch.name}
                        </span>
                    </div>
                    <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600">
                        {formatLongDate(schedule.workDate, locale)}
                    </span>
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-600">
                    {formatTime(schedule.startTimeSnapshot)} - {formatTime(schedule.endTimeSnapshot)}
                    {schedule.isOvernight
                        ? ` / ${t('workSchedules.overnight')}`
                        : ''}{' '}
                    / {formatDuration(schedule.workingDurationMinutes)}
                </div>
            </div>
            <div className="flex justify-end gap-2" onClick={(event) => event.stopPropagation()}>
                <IconButton label={t('common.view')} icon={faEye} onClick={() => onView(schedule)} />
                {canManage && (
                    <>
                        <IconButton label={t('common.edit')} icon={faPen} tone="blue" onClick={() => onEdit(schedule)} />
                        <details className="relative">
                            <summary
                                aria-label={t('workSchedules.openActions')}
                                className="flex size-9 cursor-pointer list-none items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-100"
                                title={t('workSchedules.openActions')}
                            >
                                <FontAwesomeIcon icon={faEllipsisVertical} />
                            </summary>
                            <div className="absolute right-0 z-10 mt-2 min-w-36 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                                <button
                                    className="w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                                    onClick={() => onDelete(schedule)}
                                    type="button"
                                >
                                    {t('common.delete')}
                                </button>
                            </div>
                        </details>
                    </>
                )}
            </div>
        </article>
    );
}

function StatusBadge({
    compact = false,
    status,
}: {
    compact?: boolean;
    status: ScheduleOperationalStatus;
}) {
    const { t } = useI18n();
    const config: Record<
        ScheduleOperationalStatus,
        { className: string; label: string }
    > = {
        enough: {
            className: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
            label: t('workSchedules.statusEnough'),
        },
        understaffed: {
            className: 'bg-amber-50 text-amber-700 ring-amber-100',
            label: t('workSchedules.statusUnderstaffed'),
        },
        pending: {
            className: 'bg-sky-50 text-sky-700 ring-sky-100',
            label: t('workSchedules.statusPending'),
        },
        conflict: {
            className: 'bg-red-50 text-red-700 ring-red-100',
            label: t('workSchedules.statusConflict'),
        },
        cancelled: {
            className: 'bg-slate-100 text-slate-600 ring-slate-200',
            label: t('workSchedules.statusCancelled'),
        },
    };

    const item = config[status];

    return (
        <span
            className={`inline-flex shrink-0 items-center rounded-full font-bold ring-1 ${item.className} ${
                compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
            }`}
        >
            {item.label}
        </span>
    );
}

function IconButton({
    icon,
    label,
    tone = 'primary',
    onClick,
}: {
    icon: Parameters<typeof FontAwesomeIcon>[0]['icon'];
    label: string;
    tone?: 'primary' | 'blue' | 'red';
    onClick: () => void;
}) {
    const toneClass =
        tone === 'red'
            ? 'border-red-100 bg-red-50 text-red-600 hover:bg-red-600'
            : tone === 'blue'
              ? 'border-blue-100 bg-blue-50 text-blue-600 hover:bg-blue-600'
              : 'border-primary-100 bg-primary-50 text-primary-600 hover:bg-primary-600';
    return (
        <button
            aria-label={label}
            className={`flex size-9 items-center justify-center rounded-lg border transition hover:text-white ${toneClass}`}
            onClick={onClick}
            title={label}
            type="button"
        >
            <FontAwesomeIcon icon={icon} />
        </button>
    );
}

function ScheduleFormDialog({
    branches,
    editing,
    employees,
    positions,
    saving,
    workShifts,
    onClose,
    onSubmit,
}: {
    branches: Branch[];
    editing: WorkSchedule | null;
    employees: Employee[];
    positions: Position[];
    saving: boolean;
    workShifts: WorkShift[];
    onClose: () => void;
    onSubmit: (payload: WorkSchedulePayload | UpdateWorkSchedulePayload) => Promise<void>;
}) {
    const { t } = useI18n();
    const [values, setValues] = useState<ScheduleFormValues>(() =>
        getInitialScheduleValues(editing),
    );
    const availablePositions = getAssignablePositions(
        values.employeeId ? [values.employeeId] : [],
        values.branchId,
        employees,
        positions,
    );
    const availableEmployees = employees.filter(
        (employee) =>
            values.branchId && employeeBelongsToBranch(employee, values.branchId),
    );

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (editing) {
            await onSubmit({
                branchId: values.branchId,
                positionId: values.positionId,
                workShiftId: values.workShiftId,
                workDate: values.workDate,
                note: values.note.trim() || undefined,
            });
            return;
        }

        await onSubmit({
            employeeId: values.employeeId,
            branchId: values.branchId,
            positionId: values.positionId,
            workShiftId: values.workShiftId,
            workDate: values.workDate,
            note: values.note.trim() || undefined,
        });
    }

    return (
        <Modal title={editing ? t('workSchedules.update') : t('workSchedules.add')} onClose={onClose}>
            <form className="grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
                <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                    <NativeSelect
                        label={t('workSchedules.branch')}
                        value={values.branchId}
                        onChange={(value) =>
                            setValues((current) => ({
                                ...current,
                                branchId: value,
                                employeeId: '',
                                positionId: '',
                            }))
                        }
                        options={[
                            { value: '', label: t('workSchedules.selectBranch') },
                            ...branches.map((branch) => ({
                                value: branch.id,
                                label: branch.name,
                            })),
                        ]}
                    />
                    <NativeSelect
                        label={t('workSchedules.employee')}
                        value={values.employeeId}
                        onChange={(value) =>
                            setValues((current) => ({
                                ...current,
                                employeeId: value,
                                positionId: '',
                            }))
                        }
                        options={[
                            {
                                value: '',
                                label: values.branchId
                                    ? t('workSchedules.selectEmployee')
                                    : t('workSchedules.selectBranchFirst'),
                            },
                            ...availableEmployees.map((employee) => ({
                                value: employee.id,
                                label: formatEmployee(employee),
                            })),
                        ]}
                    />
                </div>
                <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                    <NativeSelect
                        label={t('workSchedules.position')}
                        value={values.positionId}
                        onChange={(value) => setValues((current) => ({ ...current, positionId: value }))}
                        options={[
                            {
                                value: '',
                                label: values.employeeId
                                    ? t('workSchedules.selectPosition')
                                    : t('workSchedules.selectEmployeeFirst'),
                            },
                            ...availablePositions.map((position) => ({
                                value: position.id,
                                label: position.name,
                            })),
                        ]}
                    />
                </div>
                <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                    <NativeSelect
                        label={t('workSchedules.shift')}
                        value={values.workShiftId}
                        onChange={(value) => setValues((current) => ({ ...current, workShiftId: value }))}
                        options={[
                            { value: '', label: t('workSchedules.selectShift') },
                            ...workShifts.map((shift) => ({
                                value: shift.id,
                                label: `${shift.code} - ${shift.name}`,
                            })),
                        ]}
                    />
                    <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
                        {t('workSchedules.workDate')}
                        <input
                            className={fieldClass}
                            required
                            type="date"
                            value={values.workDate}
                            onChange={(event) =>
                                setValues((current) => ({ ...current, workDate: event.target.value }))
                            }
                        />
                    </label>
                </div>
                <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
                    {t('workSchedules.note')}
                    <textarea
                        className={`${fieldClass} min-h-24 py-3`}
                        value={values.note}
                        onChange={(event) =>
                            setValues((current) => ({ ...current, note: event.target.value }))
                        }
                    />
                </label>
                <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                    <Button disabled={saving} onClick={onClose} variant="secondary">
                        {t('common.cancel')}
                    </Button>
                    <Button disabled={saving || !values.positionId} loading={saving} type="submit">
                        {t('common.save')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

function BulkAssignDialog({
    branches,
    employees,
    positions,
    saving,
    workShifts,
    onClose,
    onSubmit,
}: {
    branches: Branch[];
    employees: Employee[];
    positions: Position[];
    saving: boolean;
    workShifts: WorkShift[];
    onClose: () => void;
    onSubmit: (payload: BulkWorkSchedulePayload) => Promise<void>;
}) {
    const { t } = useI18n();
    const [values, setValues] = useState<BulkFormValues>(getInitialBulkValues);
    const availablePositions = getAssignablePositions(
        values.employeeIds,
        values.branchId,
        employees,
        positions,
    );
    const availableEmployees = employees.filter(
        (employee) =>
            values.branchId && employeeBelongsToBranch(employee, values.branchId),
    );
    const weekdays = [
        [1, t('workSchedules.monday')],
        [2, t('workSchedules.tuesday')],
        [3, t('workSchedules.wednesday')],
        [4, t('workSchedules.thursday')],
        [5, t('workSchedules.friday')],
        [6, t('workSchedules.saturday')],
        [7, t('workSchedules.sunday')],
    ] as const;

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        await onSubmit({
            employeeIds: values.employeeIds,
            branchId: values.branchId,
            positionId: values.positionId,
            workShiftId: values.workShiftId,
            startDate: values.startDate,
            endDate: values.endDate,
            weekdays: values.weekdays.length ? values.weekdays : undefined,
            conflictStrategy: values.conflictStrategy,
            note: values.note.trim() || undefined,
        });
    }

    return (
        <Modal title={t('workSchedules.bulkTitle')} widthClass="max-w-3xl" onClose={onClose}>
            <form className="grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
                <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
                    <NativeSelect
                        label={t('workSchedules.branch')}
                        value={values.branchId}
                        onChange={(value) =>
                            setValues((current) => ({
                                ...current,
                                branchId: value,
                                employeeIds: [],
                                positionId: '',
                            }))
                        }
                        options={[
                            { value: '', label: t('workSchedules.selectBranch') },
                            ...branches.map((branch) => ({
                                value: branch.id,
                                label: branch.name,
                            })),
                        ]}
                    />
                    <NativeSelect
                        label={t('workSchedules.shift')}
                        value={values.workShiftId}
                        onChange={(value) => setValues((current) => ({ ...current, workShiftId: value }))}
                        options={[
                            { value: '', label: t('workSchedules.selectShift') },
                            ...workShifts.map((shift) => ({
                                value: shift.id,
                                label: `${shift.code} - ${shift.name}`,
                            })),
                        ]}
                    />
                </div>
                <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
                            {t('workSchedules.employeesInBranch')}
                        </span>
                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600">
                            {interpolate(t('workSchedules.selectedEmployees'), {
                                count: values.employeeIds.length,
                            })}
                        </span>
                    </div>
                    {!values.branchId ? (
                        <p className="rounded-lg bg-white px-3 py-4 text-sm font-semibold text-slate-500">
                            {t('workSchedules.selectBranchFirst')}
                        </p>
                    ) : (
                        <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto max-sm:grid-cols-1">
                            {availableEmployees.map((employee) => {
                                const checked = values.employeeIds.includes(employee.id);

                                return (
                                    <label
                                        className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border bg-white px-3 py-2 text-sm font-semibold transition ${
                                            checked
                                                ? 'border-primary-300 text-primary-800 ring-2 ring-primary-100'
                                                : 'border-slate-200 text-slate-700 hover:border-primary-200'
                                        }`}
                                        key={employee.id}
                                    >
                                        <input
                                            checked={checked}
                                            className="size-4 accent-primary-600"
                                            onChange={(event) =>
                                                setValues((current) => {
                                                    const employeeIds = event.target.checked
                                                        ? [...current.employeeIds, employee.id]
                                                        : current.employeeIds.filter(
                                                              (employeeId) => employeeId !== employee.id,
                                                          );

                                                    return {
                                                        ...current,
                                                        employeeIds,
                                                        positionId: '',
                                                    };
                                                })
                                            }
                                            type="checkbox"
                                        />
                                        <span className="min-w-0">
                                            <span className="block truncate">
                                                {employee.firstName} {employee.lastName}
                                            </span>
                                            <span className="block truncate text-xs font-bold text-slate-400">
                                                {employee.employeeCode}
                                            </span>
                                        </span>
                                    </label>
                                );
                            })}
                            {availableEmployees.length === 0 && (
                                <p className="col-span-2 rounded-lg bg-white px-3 py-4 text-sm font-semibold text-slate-500 max-sm:col-span-1">
                                    {t('workSchedules.noEmployeesInBranch')}
                                </p>
                            )}
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
                    <NativeSelect
                        label={t('workSchedules.position')}
                        value={values.positionId}
                        onChange={(value) => setValues((current) => ({ ...current, positionId: value }))}
                        options={[
                            {
                                value: '',
                                label: values.employeeIds.length
                                    ? t('workSchedules.selectPosition')
                                    : t('workSchedules.selectEmployeeFirst'),
                            },
                            ...availablePositions.map((position) => ({
                                value: position.id,
                                label: position.name,
                            })),
                        ]}
                    />
                </div>
                <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
                    <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
                        {t('workSchedules.startDate')}
                        <input
                            className={fieldClass}
                            required
                            type="date"
                            value={values.startDate}
                            onChange={(event) =>
                                setValues((current) => ({ ...current, startDate: event.target.value }))
                            }
                        />
                    </label>
                    <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
                        {t('workSchedules.endDate')}
                        <input
                            className={fieldClass}
                            required
                            type="date"
                            value={values.endDate}
                            onChange={(event) =>
                                setValues((current) => ({ ...current, endDate: event.target.value }))
                            }
                        />
                    </label>
                    <NativeSelect
                        label={t('workSchedules.conflict')}
                        value={values.conflictStrategy}
                        onChange={(value) =>
                            setValues((current) => ({
                                ...current,
                                conflictStrategy: value as 'SKIP' | 'REPLACE',
                            }))
                        }
                        options={[
                            { value: 'SKIP', label: t('workSchedules.skipExisting') },
                            { value: 'REPLACE', label: t('workSchedules.replaceUnlocked') },
                        ]}
                    />
                </div>
                <div className="grid gap-2">
                    <span className="text-xs font-semibold text-slate-600">{t('workSchedules.weekdays')}</span>
                    <div className="flex flex-wrap gap-2">
                        {weekdays.map(([value, label]) => {
                            const checked = values.weekdays.includes(value);
                            return (
                                <button
                                    className={`min-h-9 rounded-lg border px-3 text-sm font-semibold ${
                                        checked
                                            ? 'border-primary-200 bg-primary-50 text-primary-700'
                                            : 'border-slate-200 bg-white text-slate-600'
                                    }`}
                                    key={value}
                                    onClick={() =>
                                        setValues((current) => ({
                                            ...current,
                                            weekdays: checked
                                                ? current.weekdays.filter((day) => day !== value)
                                                : [...current.weekdays, value].sort(),
                                        }))
                                    }
                                    type="button"
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
                    {t('workSchedules.note')}
                    <textarea
                        className={`${fieldClass} min-h-20 py-3`}
                        value={values.note}
                        onChange={(event) =>
                            setValues((current) => ({ ...current, note: event.target.value }))
                        }
                    />
                </label>
                <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                    <Button disabled={saving} onClick={onClose} variant="secondary">
                        {t('common.cancel')}
                    </Button>
                    <Button
                        disabled={values.employeeIds.length === 0 || !values.positionId || saving}
                        loading={saving}
                        type="submit"
                    >
                        {t('workSchedules.assign')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

function ScheduleDetailsDialog({
    locale,
    schedule,
    onClose,
}: {
    locale: string;
    schedule: WorkSchedule;
    onClose: () => void;
}) {
    const { t } = useI18n();

    return (
        <Modal title={t('workSchedules.detailsTitle')} onClose={onClose}>
            <div className="grid gap-3 text-sm">
                {[
                    [t('workSchedules.employee'), formatEmployee(schedule.employee)],
                    [t('workSchedules.date'), formatLongDate(schedule.workDate, locale)],
                    [t('workSchedules.branch'), schedule.branch.name],
                    [t('workSchedules.position'), schedule.position.name],
                    [t('workSchedules.shift'), `${schedule.shiftCodeSnapshot} - ${schedule.shiftNameSnapshot}`],
                    [t('workSchedules.time'), `${formatTime(schedule.startTimeSnapshot)} - ${formatTime(schedule.endTimeSnapshot)}`],
                    [t('workSchedules.break'), `${schedule.breakMinutesSnapshot} ${t('workSchedules.minutes')}`],
                    [t('workSchedules.duration'), formatDuration(schedule.workingDurationMinutes)],
                    [t('workSchedules.note'), schedule.note || '-'],
                ].map(([label, value]) => (
                    <div className="grid grid-cols-[110px_1fr] gap-3" key={label}>
                        <span className="font-semibold text-slate-500">{label}</span>
                        <span className="text-slate-900">{value}</span>
                    </div>
                ))}
            </div>
            <div className="mt-6 flex justify-end">
                <Button onClick={onClose} variant="secondary">
                    {t('workSchedules.close')}
                </Button>
            </div>
        </Modal>
    );
}

function Modal({
    children,
    title,
    widthClass = 'max-w-xl',
    onClose,
}: {
    children: React.ReactNode;
    title: string;
    widthClass?: string;
    onClose: () => void;
}) {
    const { t } = useI18n();

    return (
        <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/55 p-5"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div className={`flex max-h-[calc(100vh-40px)] w-full ${widthClass} flex-col overflow-hidden rounded-xl bg-white shadow-2xl`}>
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                    <h2 className="text-xl font-bold text-slate-950">{title}</h2>
                    <Button aria-label={t('workSchedules.close')} onClick={onClose} size="icon" variant="ghost">
                        <FontAwesomeIcon icon={faXmark} />
                    </Button>
                </div>
                <div className="overflow-y-auto px-6 py-5">{children}</div>
            </div>
        </div>
    );
}
