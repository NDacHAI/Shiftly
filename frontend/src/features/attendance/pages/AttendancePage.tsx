import {
    type FormEvent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowRotateRight,
    faCircleCheck,
    faClock,
    faPenToSquare,
    faPlus,
    faSearch,
    faUserSlash,
    type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Pagination } from '@/components/ui/Pagination';
import { roles, type Role } from '@/constants/roles';
import { DialogShell } from '@/components/feedback/DialogShell';
import { useToast } from '@/components/feedback/useToast';
import { useI18n } from '@/i18n';
import {
    adjustAttendance,
    checkIn,
    checkOut,
    confirmAttendance,
    getAttendanceErrorKey,
    listAttendances,
    listMyAttendanceSchedules,
    manualCreateAttendance,
    markAbsent,
    type ListAttendancesParams,
} from '../api/attendance.api';
import {
    type AttendanceDisplayStatus,
    type AttendanceListItem,
} from '../types';
import { fieldClass, IconButton, PageHeader } from '@/components/ui';

type AttendancePageProps = {
    userRole: Role;
};

type AttendanceDialogState =
    | { type: 'manual'; item: AttendanceListItem }
    | { type: 'adjust'; item: AttendanceListItem }
    | { type: 'absent'; item: AttendanceListItem }
    | null;

type AttendanceFormState = {
    checkInAt: string;
    checkOutAt: string;
    reason: string;
    note: string;
};

const pageSize = 10;
const textAreaClass =
    'min-h-24 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100';

export function AttendancePage({ userRole }: AttendancePageProps) {
    const { t } = useI18n();
    const { showToast } = useToast();
    const [items, setItems] = useState<AttendanceListItem[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [fromDate, setFromDate] = useState(today());
    const [toDate, setToDate] = useState(today());
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [processingKey, setProcessingKey] = useState<string | null>(null);
    const [dialogState, setDialogState] = useState<AttendanceDialogState>(null);
    const [formState, setFormState] = useState<AttendanceFormState>({
        checkInAt: '',
        checkOutAt: '',
        reason: '',
        note: '',
    });

    const isManagerView = userRole === roles.admin || userRole === roles.manager;
    const title = isManagerView
        ? t('attendance.managerTitle')
        : t('attendance.employeeTitle');
    const subtitle = isManagerView
        ? t('attendance.managerSubtitle')
        : t('attendance.employeeSubtitle');

    const params = useMemo<ListAttendancesParams>(
        () => ({
            page,
            limit: pageSize,
            fromDate,
            toDate,
            search: search || undefined,
            sortBy: 'scheduleDate',
            sortOrder: 'DESC',
        }),
        [fromDate, page, search, toDate],
    );

    const loadAttendances = useCallback(async () => {
        setLoading(true);
        try {
            const response = isManagerView
                ? await listAttendances(params)
                : await listMyAttendanceSchedules(params);

            setItems(response.data);
            setTotalPages(response.meta.totalPages || 1);
        } catch (error) {
            showToast({
                title: t('attendance.loadError'),
                message: t(getAttendanceErrorKey(error)),
                variant: 'error',
            });
        } finally {
            setLoading(false);
        }
    }, [isManagerView, params, showToast, t]);

    useEffect(() => {
        void loadAttendances();
    }, [loadAttendances]);

    async function runAction(key: string, action: () => Promise<unknown>, message: string) {
        setProcessingKey(key);
        try {
            await action();
            showToast({
                title: t('common.success'),
                message,
                variant: 'success',
            });
            await loadAttendances();
        } catch (error) {
            showToast({
                title: t('attendance.actionError'),
                message: t(getAttendanceErrorKey(error)),
                variant: 'error',
            });
        } finally {
            setProcessingKey(null);
        }
    }

    function openManualDialog(item: AttendanceListItem) {
        setDialogState({ type: 'manual', item });
        setFormState({
            checkInAt: toInputDateTime(item.scheduledStartAt),
            checkOutAt: '',
            reason: '',
            note: '',
        });
    }

    function openAdjustDialog(item: AttendanceListItem) {
        if (!item.attendanceId) {
            return;
        }

        setDialogState({ type: 'adjust', item });
        setFormState({
            checkInAt: toInputDateTime(item.checkInAt),
            checkOutAt: toInputDateTime(item.checkOutAt),
            reason: '',
            note: '',
        });
    }

    function openAbsentDialog(item: AttendanceListItem) {
        setDialogState({ type: 'absent', item });
        setFormState({
            checkInAt: '',
            checkOutAt: '',
            reason: '',
            note: '',
        });
    }

    function closeDialog() {
        if (processingKey) {
            return;
        }

        setDialogState(null);
    }

    async function handleDialogSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!dialogState || !formState.reason.trim()) {
            return;
        }

        const { item, type } = dialogState;

        if (type === 'manual') {
            if (!formState.checkInAt) {
                return;
            }

            await runAction(
                `manual-${item.workScheduleId}`,
                () =>
                    manualCreateAttendance(item.workScheduleId, {
                        checkInAt: formState.checkInAt,
                        checkOutAt: formState.checkOutAt || undefined,
                        reason: formState.reason,
                        note: formState.note || undefined,
                    }),
                t('attendance.manualCreated'),
            );
        }

        if (type === 'adjust' && item.attendanceId) {
            await runAction(
                `adjust-${item.attendanceId}`,
                () =>
                    adjustAttendance(item.attendanceId!, {
                        checkInAt: formState.checkInAt || undefined,
                        checkOutAt: formState.checkOutAt || undefined,
                        reason: formState.reason,
                        note: formState.note || undefined,
                    }),
                t('attendance.adjusted'),
            );
        }

        if (type === 'absent') {
            await runAction(
                `absent-${item.workScheduleId}`,
                () =>
                    markAbsent(item.workScheduleId, {
                        reason: formState.reason,
                        note: formState.note || undefined,
                    }),
                t('attendance.markedAbsent'),
            );
        }

        setDialogState(null);
    }

    return (
        <section className="mx-auto grid max-w-[1440px] gap-5 p-6 max-sm:p-4">
            <PageHeader
                actions={
                    <Button
                        className="max-md:w-full"
                        onClick={() => void loadAttendances()}
                        size="lg"
                        variant="secondary"
                    >
                        <FontAwesomeIcon icon={faArrowRotateRight} />
                        {t('common.refresh')}
                    </Button>
                }
                description={subtitle}
                icon={<FontAwesomeIcon icon={faClock} />}
                title={title}
            />

            <div className="relative overflow-hidden rounded-xl border border-line bg-white shadow-card">
                <LoadingOverlay
                    label={t('attendance.loading')}
                    visible={loading}
                />

                <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
                    <label className="grid min-w-40 gap-1.5 text-xs font-bold text-slate-500 uppercase">
                        {t('attendance.fromDate')}
                        <input
                            className={fieldClass}
                            type="date"
                            value={fromDate}
                            onChange={(event) => {
                                setPage(1);
                                setFromDate(event.target.value);
                            }}
                        />
                    </label>
                    <label className="grid min-w-40 gap-1.5 text-xs font-bold text-slate-500 uppercase">
                        {t('attendance.toDate')}
                        <input
                            className={fieldClass}
                            type="date"
                            value={toDate}
                            onChange={(event) => {
                                setPage(1);
                                setToDate(event.target.value);
                            }}
                        />
                    </label>
                    <label className="relative min-w-72 flex-1">
                        <FontAwesomeIcon
                            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
                            icon={faSearch}
                        />
                        <input
                            className={`${fieldClass} pl-9`}
                            placeholder={t('attendance.searchPlaceholder')}
                            value={search}
                            onChange={(event) => {
                                setPage(1);
                                setSearch(event.target.value);
                            }}
                        />
                    </label>
                </div>

                <div className="overflow-x-auto">
                    <table className="data-table w-full min-w-[1120px] table-fixed">
                        <thead>
                            <tr>
                                <th className="w-[18%]">
                                    {t('attendance.employee')}
                                </th>
                                <th className="w-[10%]">
                                    {t('attendance.date')}
                                </th>
                                <th className="w-[15%]">
                                    {t('attendance.shift')}
                                </th>
                                <th className="w-[16%]">
                                    {t('attendance.time')}
                                </th>
                                <th className="w-[13%]">
                                    {t('attendance.statusLabel')}
                                </th>
                                <th className="w-[14%]">
                                    {t('attendance.minutes')}
                                </th>
                                <th className="cell-actions w-[14%]">
                                    {t('common.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr
                                    className="border-b border-slate-100 hover:bg-slate-50"
                                    key={item.workScheduleId}
                                >
                                    <td>
                                        <div className="truncate font-semibold text-slate-800">
                                            {formatEmployee(item)}
                                        </div>
                                        <div className="mt-1 truncate text-xs text-slate-500">
                                            {item.workSchedule.branch?.name}
                                            {' · '}
                                            {item.workSchedule.position?.name}
                                        </div>
                                    </td>
                                    <td>
                                        {formatDate(item.scheduleDate)}
                                    </td>
                                    <td>
                                        <div className="truncate font-semibold text-slate-800">
                                            {item.workSchedule.shiftNameSnapshot}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {item.workSchedule.shiftCodeSnapshot}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="font-semibold text-slate-800">
                                            {formatTime(item.scheduledStartAt)}
                                            {' - '}
                                            {formatTime(item.scheduledEndAt)}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {formatTime(item.checkInAt)}
                                            {' / '}
                                            {formatTime(item.checkOutAt)}
                                        </div>
                                    </td>
                                    <td>
                                        <StatusBadge status={item.displayStatus} />
                                    </td>
                                    <td>
                                        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                                            <span className="text-slate-400">{t('attendance.worked')}</span>
                                            <span className="font-semibold text-slate-700">{item.workedMinutes}</span>
                                            <span className="text-slate-400">{t('attendance.late')}</span>
                                            <span className="font-semibold text-slate-700">{item.lateMinutes}</span>
                                            <span className="text-slate-400">{t('attendance.early')}</span>
                                            <span className="font-semibold text-slate-700">{item.earlyLeaveMinutes}</span>
                                            <span className="text-slate-400">{t('attendance.overtime')}</span>
                                            <span className="font-semibold text-slate-700">{item.overtimeMinutes}</span>
                                        </div>
                                    </td>
                                    <td className="cell-actions">
                                        <div className="flex items-center justify-end gap-1">
                                            {!isManagerView && item.displayStatus === 'NOT_CHECKED_IN' && (
                                                <ActionButton
                                                    icon={faClock}
                                                    label={t('attendance.checkIn')}
                                                    loading={processingKey === `checkin-${item.workScheduleId}`}
                                                    onClick={() =>
                                                        void runAction(
                                                            `checkin-${item.workScheduleId}`,
                                                            () => checkIn(item.workScheduleId),
                                                            t('attendance.checkedIn'),
                                                        )
                                                    }
                                                />
                                            )}
                                            {!isManagerView && item.status === 'CHECKED_IN' && item.attendanceId && (
                                                <ActionButton
                                                    icon={faCircleCheck}
                                                    label={t('attendance.checkOut')}
                                                    loading={processingKey === `checkout-${item.attendanceId}`}
                                                    onClick={() =>
                                                        void runAction(
                                                            `checkout-${item.attendanceId}`,
                                                            () => checkOut(item.attendanceId!),
                                                            t('attendance.checkedOut'),
                                                        )
                                                    }
                                                />
                                            )}
                                            {isManagerView && item.status === 'PENDING_CONFIRMATION' && item.attendanceId && (
                                                <ActionButton
                                                    icon={faCircleCheck}
                                                    label={t('attendance.confirm')}
                                                    loading={processingKey === `confirm-${item.attendanceId}`}
                                                    onClick={() =>
                                                        void runAction(
                                                            `confirm-${item.attendanceId}`,
                                                            () => confirmAttendance(item.attendanceId!),
                                                            t('attendance.confirmed'),
                                                        )
                                                    }
                                                />
                                            )}
                                            {isManagerView && item.displayStatus === 'NOT_CHECKED_IN' && (
                                                <>
                                                    <ActionButton
                                                        icon={faPlus}
                                                        label={t('attendance.manual')}
                                                        loading={processingKey === `manual-${item.workScheduleId}`}
                                                        onClick={() => openManualDialog(item)}
                                                    />
                                                    <ActionButton
                                                        icon={faUserSlash}
                                                        label={t('attendance.absent')}
                                                        loading={processingKey === `absent-${item.workScheduleId}`}
                                                        onClick={() => openAbsentDialog(item)}
                                                    />
                                                </>
                                            )}
                                            {isManagerView && item.attendanceId && (
                                                <ActionButton
                                                    icon={faPenToSquare}
                                                    label={t('attendance.adjust')}
                                                    loading={processingKey === `adjust-${item.attendanceId}`}
                                                    onClick={() => openAdjustDialog(item)}
                                                />
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {!items.length && !loading && (
                    <EmptyState
                        description={t('attendance.noResultsDescription')}
                        title={t('attendance.noResultsTitle')}
                    />
                )}

                <Pagination
                    page={page}
                    pageSize={pageSize}
                    totalPages={totalPages}
                    onPageChange={setPage}
                />
            </div>

            <AttendanceActionDialog
                formState={formState}
                loading={Boolean(processingKey)}
                state={dialogState}
                onChange={setFormState}
                onClose={closeDialog}
                onSubmit={handleDialogSubmit}
            />
        </section>
    );
}

function AttendanceActionDialog({
    formState,
    loading,
    state,
    onChange,
    onClose,
    onSubmit,
}: {
    formState: AttendanceFormState;
    loading: boolean;
    state: AttendanceDialogState;
    onChange: (value: AttendanceFormState) => void;
    onClose: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
    const { t } = useI18n();

    if (!state) {
        return null;
    }

    const isAbsent = state.type === 'absent';
    const isManual = state.type === 'manual';
    const title =
        state.type === 'manual'
            ? t('attendance.manualTitle')
            : state.type === 'adjust'
              ? t('attendance.adjustTitle')
              : t('attendance.absentTitle');
    const description =
        state.type === 'manual'
            ? t('attendance.manualDescription')
            : state.type === 'adjust'
              ? t('attendance.adjustDescription')
              : t('attendance.absentDescription');

    return (
        <DialogShell
            description={description}
            open={Boolean(state)}
            title={title}
            onClose={onClose}
        >
            <form className="mt-5 grid gap-4" onSubmit={onSubmit}>
                {!isAbsent && (
                    <>
                        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                            {t('attendance.checkInAt')}
                            <input
                                className={fieldClass}
                                required={isManual}
                                type="datetime-local"
                                value={formState.checkInAt}
                                onChange={(event) =>
                                    onChange({
                                        ...formState,
                                        checkInAt: event.target.value,
                                    })
                                }
                            />
                        </label>
                        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                            {t('attendance.checkOutAt')}
                            <input
                                className={fieldClass}
                                type="datetime-local"
                                value={formState.checkOutAt}
                                onChange={(event) =>
                                    onChange({
                                        ...formState,
                                        checkOutAt: event.target.value,
                                    })
                                }
                            />
                        </label>
                    </>
                )}

                <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                    {t('attendance.reason')}
                    <textarea
                        className={textAreaClass}
                        required
                        value={formState.reason}
                        onChange={(event) =>
                            onChange({
                                ...formState,
                                reason: event.target.value,
                            })
                        }
                    />
                </label>

                <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                    {t('attendance.note')}
                    <textarea
                        className={textAreaClass}
                        value={formState.note}
                        onChange={(event) =>
                            onChange({
                                ...formState,
                                note: event.target.value,
                            })
                        }
                    />
                </label>

                <div className="mt-2 flex justify-end gap-3">
                    <Button
                        disabled={loading}
                        onClick={onClose}
                        type="button"
                        variant="secondary"
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button loading={loading} type="submit">
                        {t('common.save')}
                    </Button>
                </div>
            </form>
        </DialogShell>
    );
}

function ActionButton({
    icon,
    label,
    loading,
    onClick,
}: {
    icon: IconDefinition;
    label: string;
    loading?: boolean;
    onClick: () => void;
}) {
    return (
        <IconButton
            disabled={loading}
            icon={icon}
            label={label}
            onClick={onClick}
        />
    );
}

function StatusBadge({ status }: { status: AttendanceDisplayStatus }) {
    const { t } = useI18n();
    const className = {
        NOT_CHECKED_IN: 'bg-slate-100 text-slate-600',
        CHECKED_IN: 'bg-blue-50 text-blue-700',
        PENDING_CONFIRMATION: 'bg-amber-50 text-amber-700',
        CONFIRMED: 'bg-emerald-50 text-emerald-700',
        ABSENT: 'bg-red-50 text-red-700',
    }[status];
    const labels: Record<AttendanceDisplayStatus, string> = {
        NOT_CHECKED_IN: t('attendance.status.notCheckedIn'),
        CHECKED_IN: t('attendance.status.checkedIn'),
        PENDING_CONFIRMATION: t('attendance.status.pendingConfirmation'),
        CONFIRMED: t('attendance.status.confirmed'),
        ABSENT: t('attendance.status.absent'),
    };

    return (
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-current/15 ring-inset ${className}`}>
            {labels[status]}
        </span>
    );
}

function formatEmployee(item: AttendanceListItem): string {
    const employee = item.workSchedule.employee;
    const fullName = [employee?.firstName, employee?.lastName]
        .filter(Boolean)
        .join(' ');

    return `${employee?.employeeCode ?? ''} ${fullName}`.trim() || '-';
}

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('vi-VN').format(new Date(`${value}T00:00:00`));
}

function formatTime(value?: string | null): string {
    if (!value) {
        return '--:--';
    }

    return new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

function toInputDateTime(value?: string | null): string {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    const offsetMs = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function today(): string {
    return new Date().toISOString().slice(0, 10);
}
