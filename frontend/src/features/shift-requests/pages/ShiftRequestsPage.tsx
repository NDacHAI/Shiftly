import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBan,
    faCalendarPlus,
    faCheck,
    faClipboardList,
    faEye,
    faRotateRight,
    faSearch,
    faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { ConfirmDialog, useToast } from '@/components/feedback';
import { DialogShell } from '@/components/feedback/DialogShell';
import {
    Button,
    DropdownSelect,
    EmptyState,
    LoadingOverlay,
    Pagination,
} from '@/components/ui';
import { roles, type Role } from '@/constants/roles';
import { listBranches } from '@/features/branches/api/branches.api';
import { type Branch } from '@/features/branches/types';
import { getMyEmployee } from '@/features/employees/api/employees.api';
import { listPositions } from '@/features/positions/api/positions.api';
import { type Position } from '@/features/positions/types';
import { listWorkShifts } from '@/features/work-shifts/api/work-shift.api';
import { type WorkShift, WorkShiftStatus } from '@/features/work-shifts/types';
import { useI18n } from '@/i18n';
import {
    approveShiftRequest,
    cancelShiftRequest,
    createShiftRequest,
    getShiftRequestErrorKey,
    listMyShiftRequests,
    listShiftRequests,
    rejectShiftRequest,
} from '../api/shift-requests.api';
import {
    type ShiftRequest,
    type ShiftRequestPayload,
    ShiftRequestStatus,
    type ShiftRequestStatusFilter,
} from '../types';

const pageSize = 10;
const fieldClass =
    'min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500';

type ShiftRequestsPageProps = {
    userRole: Role;
};

type FormValues = {
    branchId: string;
    positionId: string;
    workShiftId: string;
    workDate: string;
    employeeNote: string;
};

type ReviewAction = 'approve' | 'reject';

type ReviewState = {
    request: ShiftRequest;
    action: ReviewAction;
};

function today() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDate(value: string, locale = 'vi-VN') {
    return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(`${value}T00:00:00`));
}

function formatTime(value: string) {
    return value.slice(0, 5);
}

function formatEmployee(request: ShiftRequest) {
    return `${request.employee.employeeCode} - ${request.employee.firstName} ${request.employee.lastName}`;
}

function statusClass(status: ShiftRequestStatus) {
    if (status === ShiftRequestStatus.Pending) return 'bg-amber-50 text-amber-700';
    if (status === ShiftRequestStatus.Approved) return 'bg-emerald-50 text-emerald-700';
    if (status === ShiftRequestStatus.Rejected) return 'bg-red-50 text-red-700';
    return 'bg-slate-100 text-slate-600';
}

function toStatusFilter(value: ShiftRequestStatusFilter) {
    return value === 'all' ? undefined : Number(value) as ShiftRequestStatus;
}

const initialFormValues: FormValues = {
    branchId: '',
    positionId: '',
    workShiftId: '',
    workDate: today(),
    employeeNote: '',
};

export function ShiftRequestsPage({ userRole }: ShiftRequestsPageProps) {
    const { showToast } = useToast();
    const { t } = useI18n();
    const employeeMode = userRole === roles.user;
    const [requests, setRequests] = useState<ShiftRequest[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [statusFilter, setStatusFilter] =
        useState<ShiftRequestStatusFilter>('all');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [branchFilter, setBranchFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [filtersLoading, setFiltersLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formValues, setFormValues] = useState<FormValues>(initialFormValues);
    const [reviewState, setReviewState] = useState<ReviewState | null>(null);
    const [reviewNote, setReviewNote] = useState('');
    const [selectedRequest, setSelectedRequest] =
        useState<ShiftRequest | null>(null);
    const [processingReview, setProcessingReview] = useState(false);
    const [requestToCancel, setRequestToCancel] = useState<ShiftRequest | null>(null);
    const [processingConfirm, setProcessingConfirm] = useState(false);

    const branchOptions = useMemo(
        () => branches.filter((branch) => branch.status),
        [branches],
    );
    const positionOptions = useMemo(
        () =>
            positions.filter(
                (position) =>
                    position.status &&
                    (!formValues.branchId ||
                        position.branchId === formValues.branchId),
            ),
        [formValues.branchId, positions],
    );

    const loadRequests = useCallback(async () => {
        setLoading(true);

        try {
            const params = {
                page,
                limit: pageSize,
                status: toStatusFilter(statusFilter),
                branchId:
                    !employeeMode && branchFilter !== 'all'
                        ? branchFilter
                        : undefined,
                fromDate: fromDate || undefined,
                toDate: toDate || undefined,
                sortBy: 'workDate' as const,
                sortOrder: 'DESC' as const,
            };
            const response = employeeMode
                ? await listMyShiftRequests(params)
                : await listShiftRequests(params);

            setRequests(response.data);
            setTotalPages(response.meta.totalPages);
        } catch (error) {
            showToast({
                message: t(getShiftRequestErrorKey(error)),
                title: t('shiftRequests.loadError'),
                variant: 'error',
            });
        } finally {
            setLoading(false);
        }
    }, [
        branchFilter,
        employeeMode,
        fromDate,
        page,
        showToast,
        statusFilter,
        t,
        toDate,
    ]);

    const loadFilters = useCallback(async () => {
        setFiltersLoading(true);

        try {
            if (employeeMode) {
                const [employee, workShiftResponse] = await Promise.all([
                    getMyEmployee(),
                    listWorkShifts({
                        page: 1,
                        limit: 100,
                        status: WorkShiftStatus.Active,
                    }),
                ]);

                setBranches(employee.branches);
                setPositions(employee.positions);
                setWorkShifts(workShiftResponse.data);
                return;
            }

            const [branchResponse, positionResponse, workShiftResponse] =
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
                    listWorkShifts({
                        page: 1,
                        limit: 100,
                        status: WorkShiftStatus.Active,
                    }),
                ]);

            setBranches(branchResponse.data);
            setPositions(positionResponse.data);
            setWorkShifts(workShiftResponse.data);
        } catch (error) {
            showToast({
                message: t(getShiftRequestErrorKey(error)),
                title: t('shiftRequests.filtersLoadError'),
                variant: 'error',
            });
        } finally {
            setFiltersLoading(false);
        }
    }, [employeeMode, showToast, t]);

    useEffect(() => {
        void loadFilters();
    }, [loadFilters]);

    useEffect(() => {
        void loadRequests();
    }, [loadRequests]);

    function resetForm() {
        setFormValues(initialFormValues);
    }

    function updateFormValue<TKey extends keyof FormValues>(
        key: TKey,
        value: FormValues[TKey],
    ) {
        setFormValues((current) => ({
            ...current,
            [key]: value,
            ...(key === 'branchId'
                ? {
                      positionId: '',
                  }
                : {}),
        }));
    }

    async function handleCreate(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (
            !formValues.branchId ||
            !formValues.positionId ||
            !formValues.workShiftId ||
            !formValues.workDate
        ) {
            showToast({
                message: t('shiftRequests.requiredMessage'),
                title: t('common.required'),
                variant: 'error',
            });
            return;
        }

        setSaving(true);

        try {
            const payload: ShiftRequestPayload = {
                branchId: formValues.branchId,
                positionId: formValues.positionId,
                workShiftId: formValues.workShiftId,
                workDate: formValues.workDate,
                employeeNote: formValues.employeeNote.trim() || undefined,
            };

            await createShiftRequest(payload);
            setShowForm(false);
            resetForm();
            await loadRequests();
            showToast({
                message: t('shiftRequests.created'),
                title: t('common.success'),
                variant: 'success',
            });
        } catch (error) {
            showToast({
                message: t(getShiftRequestErrorKey(error)),
                title: t('shiftRequests.saveError'),
                variant: 'error',
            });
        } finally {
            setSaving(false);
        }
    }

    async function handleReview() {
        if (!reviewState) return;

        setProcessingReview(true);

        try {
            const payload = {
                managerNote: reviewNote.trim() || undefined,
            };

            if (reviewState.action === 'approve') {
                await approveShiftRequest(reviewState.request.id, payload);
            } else {
                await rejectShiftRequest(reviewState.request.id, payload);
            }

            setReviewState(null);
            setReviewNote('');
            await loadRequests();
            showToast({
                message:
                    reviewState.action === 'approve'
                        ? t('shiftRequests.approved')
                        : t('shiftRequests.rejected'),
                title: t('common.success'),
                variant: 'success',
            });
        } catch (error) {
            showToast({
                message: t(getShiftRequestErrorKey(error)),
                title: t('shiftRequests.reviewError'),
                variant: 'error',
            });
        } finally {
            setProcessingReview(false);
        }
    }

    async function handleCancel() {
        if (!requestToCancel) return;

        setProcessingConfirm(true);

        try {
            await cancelShiftRequest(requestToCancel.id, {});
            setRequestToCancel(null);
            await loadRequests();
            showToast({
                message: t('shiftRequests.cancelled'),
                title: t('common.success'),
                variant: 'success',
            });
        } catch (error) {
            showToast({
                message: t(getShiftRequestErrorKey(error)),
                title: t('shiftRequests.cancelError'),
                variant: 'error',
            });
        } finally {
            setProcessingConfirm(false);
        }
    }

    return (
        <section className="mx-auto grid max-w-[1440px] gap-5 p-6 max-sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
                <div className="flex items-center gap-4">
                    <span className="flex size-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                        <FontAwesomeIcon icon={faClipboardList} />
                    </span>
                    <div>
                        <h2 className="text-xl font-bold text-slate-950">
                            {employeeMode
                                ? t('shiftRequests.employeeTitle')
                                : t('shiftRequests.title')}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {employeeMode
                                ? t('shiftRequests.employeeSubtitle')
                                : t('shiftRequests.subtitle')}
                        </p>
                    </div>
                </div>

                {employeeMode && (
                    <Button
                        disabled={filtersLoading}
                        onClick={() => {
                            resetForm();
                            setShowForm(true);
                        }}
                        size="lg"
                    >
                        <FontAwesomeIcon icon={faCalendarPlus} />
                        {t('shiftRequests.add')}
                    </Button>
                )}
            </div>

            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <LoadingOverlay
                    label={t('shiftRequests.loading')}
                    visible={loading}
                />

                <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
                    <DropdownSelect
                        ariaLabel={t('common.status')}
                        options={[
                            { value: 'all', label: t('common.allStatuses') },
                            { value: '0', label: t('shiftRequests.pending') },
                            { value: '1', label: t('shiftRequests.approvedStatus') },
                            { value: '2', label: t('shiftRequests.rejectedStatus') },
                            { value: '3', label: t('shiftRequests.cancelledStatus') },
                        ]}
                        value={statusFilter}
                        onChange={(value) => {
                            setStatusFilter(value as ShiftRequestStatusFilter);
                            setPage(1);
                        }}
                    />

                    {!employeeMode && (
                        <DropdownSelect
                            ariaLabel={t('common.branch')}
                            disabled={filtersLoading}
                            options={[
                                {
                                    value: 'all',
                                    label: t('common.allBranches'),
                                },
                                ...branchOptions.map((branch) => ({
                                    value: branch.id,
                                    label: branch.name,
                                })),
                            ]}
                            value={branchFilter}
                            onChange={(value) => {
                                setBranchFilter(value);
                                setPage(1);
                            }}
                        />
                    )}

                    <label className="relative min-w-40">
                        <FontAwesomeIcon
                            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
                            icon={faSearch}
                        />
                        <input
                            className={`${fieldClass} pl-9`}
                            type="date"
                            value={fromDate}
                            onChange={(event) => {
                                setFromDate(event.target.value);
                                setPage(1);
                            }}
                        />
                    </label>

                    <input
                        className={`${fieldClass} max-w-40`}
                        type="date"
                        value={toDate}
                        onChange={(event) => {
                            setToDate(event.target.value);
                            setPage(1);
                        }}
                    />

                    <Button
                        onClick={() => void loadRequests()}
                        size="lg"
                        variant="secondary"
                    >
                        <FontAwesomeIcon icon={faRotateRight} />
                        {t('common.refresh')}
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1120px] table-fixed">
                        <thead className="bg-slate-50">
                            <tr className="border-b border-slate-200">
                                <th className="w-[18%] px-4 py-3 text-center text-xs text-slate-600">
                                    {t('shiftRequests.employee')}
                                </th>
                                <th className="w-[11%] px-4 py-3 text-center text-xs text-slate-600">
                                    {t('shiftRequests.workDate')}
                                </th>
                                <th className="w-[13%] px-4 py-3 text-center text-xs text-slate-600">
                                    {t('common.branch')}
                                </th>
                                <th className="w-[12%] px-4 py-3 text-center text-xs text-slate-600">
                                    {t('common.position')}
                                </th>
                                <th className="w-[15%] px-4 py-3 text-center text-xs text-slate-600">
                                    {t('shiftRequests.shift')}
                                </th>
                                <th className="w-[11%] px-4 py-3 text-center text-xs text-slate-600">
                                    {t('common.status')}
                                </th>
                                <th className="w-[12%] px-4 py-3 text-center text-xs text-slate-600">
                                    {t('shiftRequests.note')}
                                </th>
                                <th className="w-[12%] px-4 py-3 text-center text-xs text-slate-600">
                                    {t('common.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading &&
                                requests.map((request) => (
                                    <tr
                                        className="border-b border-slate-100 hover:bg-slate-50"
                                        key={request.id}
                                    >
                                        <td className="px-4 py-3 text-sm">
                                            <div className="truncate text-center font-semibold text-slate-800">
                                                {formatEmployee(request)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm">
                                            {formatDate(request.workDate)}
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm">
                                            {request.branch.name}
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm">
                                            {request.position.name}
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm">
                                            <div className="font-semibold text-slate-800">
                                                {request.workShift.name}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {formatTime(request.workShift.startTime)} -{' '}
                                                {formatTime(request.workShift.endTime)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                                                    request.status,
                                                )}`}
                                            >
                                                {request.status ===
                                                ShiftRequestStatus.Pending
                                                    ? t('shiftRequests.pending')
                                                    : request.status ===
                                                        ShiftRequestStatus.Approved
                                                      ? t(
                                                            'shiftRequests.approvedStatus',
                                                        )
                                                      : request.status ===
                                                          ShiftRequestStatus.Rejected
                                                        ? t(
                                                              'shiftRequests.rejectedStatus',
                                                          )
                                                        : t(
                                                              'shiftRequests.cancelledStatus',
                                                          )}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center text-xs text-slate-500">
                                            <span className="line-clamp-2">
                                                {request.managerNote ||
                                                    request.employeeNote ||
                                                    '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-center gap-2">
                                                {!employeeMode &&
                                                    request.status ===
                                                        ShiftRequestStatus.Pending && (
                                                        <>
                                                            <button
                                                                aria-label={t(
                                                                    'shiftRequests.approve',
                                                                )}
                                                                className="flex size-9 min-h-0 cursor-pointer items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 p-0 text-emerald-600 transition hover:border-emerald-300 hover:bg-emerald-600 hover:text-white"
                                                                onClick={() => {
                                                                    setReviewState({
                                                                        request,
                                                                        action: 'approve',
                                                                    });
                                                                    setReviewNote('');
                                                                }}
                                                                title={t(
                                                                    'shiftRequests.approve',
                                                                )}
                                                                type="button"
                                                            >
                                                                <FontAwesomeIcon
                                                                    icon={faCheck}
                                                                />
                                                            </button>
                                                            <button
                                                                aria-label={t(
                                                                    'shiftRequests.reject',
                                                                )}
                                                                className="flex size-9 min-h-0 cursor-pointer items-center justify-center rounded-lg border border-red-100 bg-red-50 p-0 text-red-600 transition hover:border-red-300 hover:bg-red-600 hover:text-white"
                                                                onClick={() => {
                                                                    setReviewState({
                                                                        request,
                                                                        action: 'reject',
                                                                    });
                                                                    setReviewNote('');
                                                                }}
                                                                title={t(
                                                                    'shiftRequests.reject',
                                                                )}
                                                                type="button"
                                                            >
                                                                <FontAwesomeIcon
                                                                    icon={faXmark}
                                                                />
                                                            </button>
                                                        </>
                                                    )}

                                                {employeeMode &&
                                                    request.status ===
                                                        ShiftRequestStatus.Pending && (
                                                        <button
                                                            aria-label={t(
                                                                'shiftRequests.cancelRequest',
                                                            )}
                                                            className="flex size-9 min-h-0 cursor-pointer items-center justify-center rounded-lg border border-amber-100 bg-amber-50 p-0 text-amber-600 transition hover:border-amber-300 hover:bg-amber-600 hover:text-white"
                                                            onClick={() =>
                                                                setRequestToCancel(
                                                                    request,
                                                                )
                                                            }
                                                            title={t(
                                                                'shiftRequests.cancelRequest',
                                                            )}
                                                            type="button"
                                                        >
                                                            <FontAwesomeIcon
                                                                icon={faBan}
                                                            />
                                                        </button>
                                                    )}

                                                {!employeeMode && (
                                                    <button
                                                        aria-label={t(
                                                            'common.view',
                                                        )}
                                                        className="flex size-9 min-h-0 cursor-pointer items-center justify-center rounded-lg border border-primary-100 bg-primary-50 p-0 text-primary-600 transition hover:border-primary-300 hover:bg-primary-600 hover:text-white"
                                                        onClick={() =>
                                                            setSelectedRequest(
                                                                request,
                                                            )
                                                        }
                                                        title={t('common.view')}
                                                        type="button"
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={faEye}
                                                        />
                                                    </button>
                                                )}

                                                {employeeMode &&
                                                    request.status !==
                                                        ShiftRequestStatus.Pending && (
                                                        <span className="text-xs text-slate-400">
                                                            -
                                                        </span>
                                                    )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                {!loading && requests.length === 0 && (
                    <EmptyState
                        description={
                            employeeMode
                                ? t('shiftRequests.employeeNoResultsDescription')
                                : t('shiftRequests.noResultsDescription')
                        }
                        title={t('shiftRequests.noResultsTitle')}
                    />
                )}

                <Pagination
                    page={page}
                    pageSize={pageSize}
                    totalPages={totalPages}
                    onPageChange={setPage}
                />
            </div>

            <DialogShell
                description={t('shiftRequests.formDescription')}
                open={showForm}
                title={t('shiftRequests.add')}
                onClose={() => {
                    if (!saving) {
                        setShowForm(false);
                    }
                }}
            >
                <form className="mt-5 grid gap-4" onSubmit={handleCreate}>
                    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                        {t('common.branch')}
                        <div className="dropdown-select-field">
                            <DropdownSelect
                                ariaLabel={t('common.branch')}
                                disabled={filtersLoading}
                                options={branchOptions.map((branch) => ({
                                    value: branch.id,
                                    label: branch.name,
                                }))}
                                placeholder={t('shiftRequests.selectBranch')}
                                value={formValues.branchId}
                                onChange={(value) =>
                                    updateFormValue('branchId', value)
                                }
                            />
                        </div>
                    </label>

                    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                        {t('common.position')}
                        <div className="dropdown-select-field">
                            <DropdownSelect
                                ariaLabel={t('common.position')}
                                disabled={!formValues.branchId || filtersLoading}
                                options={positionOptions.map((position) => ({
                                    value: position.id,
                                    label: position.name,
                                }))}
                                placeholder={t('shiftRequests.selectPosition')}
                                value={formValues.positionId}
                                onChange={(value) =>
                                    updateFormValue('positionId', value)
                                }
                            />
                        </div>
                    </label>

                    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                        {t('shiftRequests.shift')}
                        <div className="dropdown-select-field">
                            <DropdownSelect
                                ariaLabel={t('shiftRequests.shift')}
                                disabled={filtersLoading}
                                options={workShifts.map((workShift) => ({
                                    value: workShift.id,
                                    label: `${workShift.name} (${formatTime(
                                        workShift.startTime,
                                    )} - ${formatTime(workShift.endTime)})`,
                                }))}
                                placeholder={t('shiftRequests.selectShift')}
                                value={formValues.workShiftId}
                                onChange={(value) =>
                                    updateFormValue('workShiftId', value)
                                }
                            />
                        </div>
                    </label>

                    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                        {t('shiftRequests.workDate')}
                        <input
                            className={fieldClass}
                            type="date"
                            value={formValues.workDate}
                            onChange={(event) =>
                                updateFormValue('workDate', event.target.value)
                            }
                        />
                    </label>

                    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                        {t('shiftRequests.employeeNote')}
                        <textarea
                            className={`${fieldClass} min-h-24 py-3`}
                            maxLength={1000}
                            value={formValues.employeeNote}
                            onChange={(event) =>
                                updateFormValue(
                                    'employeeNote',
                                    event.target.value,
                                )
                            }
                        />
                    </label>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            disabled={saving}
                            onClick={() => setShowForm(false)}
                            variant="secondary"
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button loading={saving} type="submit">
                            {t('common.save')}
                        </Button>
                    </div>
                </form>
            </DialogShell>

            <DialogShell
                description={t('shiftRequests.reviewDescription')}
                open={Boolean(reviewState)}
                title={
                    reviewState?.action === 'approve'
                        ? t('shiftRequests.approve')
                        : t('shiftRequests.reject')
                }
                onClose={() => {
                    if (!processingReview) {
                        setReviewState(null);
                        setReviewNote('');
                    }
                }}
            >
                <div className="mt-5 grid gap-4">
                    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                        {t('shiftRequests.managerNote')}
                        <textarea
                            className={`${fieldClass} min-h-24 py-3`}
                            maxLength={1000}
                            value={reviewNote}
                            onChange={(event) => setReviewNote(event.target.value)}
                        />
                    </label>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            disabled={processingReview}
                            onClick={() => {
                                setReviewState(null);
                                setReviewNote('');
                            }}
                            variant="secondary"
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            loading={processingReview}
                            onClick={() => void handleReview()}
                            variant={
                                reviewState?.action === 'reject'
                                    ? 'danger'
                                    : 'primary'
                            }
                        >
                            {reviewState?.action === 'approve'
                                ? t('shiftRequests.approve')
                                : t('shiftRequests.reject')}
                        </Button>
                    </div>
                </div>
            </DialogShell>

            <DialogShell
                description={t('shiftRequests.detailsDescription')}
                open={Boolean(selectedRequest)}
                panelClassName="max-w-xl"
                title={t('shiftRequests.detailsTitle')}
                onClose={() => setSelectedRequest(null)}
            >
                {selectedRequest && (
                    <div className="mt-5 grid max-h-[62vh] min-w-0 gap-3 overflow-y-auto pr-1 text-sm">
                        <DetailRow
                            label={t('shiftRequests.employee')}
                            value={formatEmployee(selectedRequest)}
                        />
                        <DetailRow
                            label={t('shiftRequests.workDate')}
                            value={formatDate(selectedRequest.workDate)}
                        />
                        <DetailRow
                            label={t('common.branch')}
                            value={selectedRequest.branch.name}
                        />
                        <DetailRow
                            label={t('common.position')}
                            value={selectedRequest.position.name}
                        />
                        <DetailRow
                            label={t('shiftRequests.shift')}
                            value={`${selectedRequest.workShift.name} (${formatTime(
                                selectedRequest.workShift.startTime,
                            )} - ${formatTime(selectedRequest.workShift.endTime)})`}
                        />
                        <DetailRow
                            label={t('common.status')}
                            value={
                                selectedRequest.status === ShiftRequestStatus.Pending
                                    ? t('shiftRequests.pending')
                                    : selectedRequest.status ===
                                        ShiftRequestStatus.Approved
                                      ? t('shiftRequests.approvedStatus')
                                      : selectedRequest.status ===
                                          ShiftRequestStatus.Rejected
                                        ? t('shiftRequests.rejectedStatus')
                                        : t('shiftRequests.cancelledStatus')
                            }
                        />
                        <DetailRow
                            label={t('shiftRequests.employeeNote')}
                            value={selectedRequest.employeeNote || '-'}
                        />
                        <DetailRow
                            label={t('shiftRequests.managerNote')}
                            value={selectedRequest.managerNote || '-'}
                        />
                        <div className="flex justify-end pt-2">
                            <Button
                                onClick={() => setSelectedRequest(null)}
                                variant="secondary"
                            >
                                {t('common.close')}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogShell>

            <ConfirmDialog
                confirmLabel={t('shiftRequests.cancelRequest')}
                description={t('shiftRequests.cancelDescription')}
                loading={processingConfirm}
                open={Boolean(requestToCancel)}
                title={t('shiftRequests.cancelRequest')}
                tone="danger"
                onCancel={() => setRequestToCancel(null)}
                onConfirm={() => void handleCancel()}
            />
        </section>
    );
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="grid min-w-0 gap-1 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
            <span className="text-xs font-semibold uppercase text-slate-500">
                {label}
            </span>
            <span className="min-w-0 whitespace-pre-wrap break-words font-medium text-slate-800 [overflow-wrap:anywhere]">
                {value}
            </span>
        </div>
    );
}
