import {
    type FormEvent,
    type ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBan,
    faCalendarMinus,
    faCheck,
    faEye,
    faRotateRight,
    faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { DialogShell } from '@/components/feedback/DialogShell';
import { useToast } from '@/components/feedback';
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
import { getMyEmployee, listEmployees } from '@/features/employees/api/employees.api';
import { type Employee } from '@/features/employees/types';
import {
    listMyWorkSchedules,
    listWorkSchedules,
} from '@/features/work-schedules/api/work-schedules.api';
import { type WorkSchedule } from '@/features/work-schedules/types';
import {
    approveLeaveRequest,
    cancelLeaveRequest,
    createLeaveRequest,
    getLeaveRequestErrorMessage,
    listLeaveRequests,
    listMyLeaveRequests,
    rejectLeaveRequest,
} from '../api/leave-requests.api';
import {
    type LeaveRequest,
    type LeaveRequestPayload,
    LeaveRequestMode,
    LeaveRequestStatus,
    type LeaveRequestStatusFilter,
} from '../types';

const pageSize = 10;
const fieldClass =
    'min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500';

type LeaveRequestsPageProps = {
    userRole: Role;
};

type FormValues = {
    employeeId: string;
    branchId: string;
    requestMode: LeaveRequestMode;
    startDate: string;
    endDate: string;
    isFullDay: boolean;
    startTime: string;
    endTime: string;
    workScheduleIds: string[];
    reason: string;
};

type ReviewState = {
    request: LeaveRequest;
    action: 'approve' | 'reject';
};

function today() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDate(value?: string | null) {
    if (!value) return '-';
    return new Intl.DateTimeFormat('vi-VN').format(new Date(`${value}T00:00:00`));
}

function formatTime(value?: string | null) {
    return value ? value.slice(0, 5) : '';
}

function formatEmployee(employee: Employee) {
    return `${employee.employeeCode} - ${employee.firstName} ${employee.lastName}`;
}

function statusLabel(status: LeaveRequestStatus) {
    if (status === LeaveRequestStatus.Pending) return 'Chờ duyệt';
    if (status === LeaveRequestStatus.Approved) return 'Đã duyệt';
    if (status === LeaveRequestStatus.Rejected) return 'Đã từ chối';
    return 'Đã hủy';
}

function statusClass(status: LeaveRequestStatus) {
    if (status === LeaveRequestStatus.Pending) return 'bg-amber-50 text-amber-700';
    if (status === LeaveRequestStatus.Approved) return 'bg-emerald-50 text-emerald-700';
    if (status === LeaveRequestStatus.Rejected) return 'bg-red-50 text-red-700';
    return 'bg-slate-100 text-slate-600';
}

function formatLeaveTime(request: LeaveRequest) {
    if (request.requestMode === LeaveRequestMode.Shift) {
        return `${request.assignments.length} ca`;
    }

    if (request.isFullDay) {
        return request.startDate === request.endDate
            ? formatDate(request.startDate)
            : `${formatDate(request.startDate)} - ${formatDate(request.endDate)}`;
    }

    return `${formatDate(request.startDate)} ${formatTime(request.startTime)} - ${formatTime(request.endTime)}`;
}

function formatSchedule(schedule: WorkSchedule) {
    return `${formatDate(schedule.workDate)} - ${schedule.shiftNameSnapshot} (${formatTime(schedule.startTimeSnapshot)} - ${formatTime(schedule.endTimeSnapshot)})`;
}

const initialFormValues: FormValues = {
    employeeId: '',
    branchId: '',
    requestMode: LeaveRequestMode.DateTime,
    startDate: today(),
    endDate: today(),
    isFullDay: true,
    startTime: '08:00',
    endTime: '12:00',
    workScheduleIds: [],
    reason: '',
};

export function LeaveRequestsPage({ userRole }: LeaveRequestsPageProps) {
    const { showToast } = useToast();
    const employeeMode = userRole === roles.user;
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [statusFilter, setStatusFilter] =
        useState<LeaveRequestStatusFilter>('all');
    const [branchFilter, setBranchFilter] = useState('all');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [loading, setLoading] = useState(true);
    const [filtersLoading, setFiltersLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formValues, setFormValues] = useState<FormValues>(initialFormValues);
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
    const [reviewState, setReviewState] = useState<ReviewState | null>(null);
    const [reviewNote, setReviewNote] = useState('');
    const [cancelTarget, setCancelTarget] = useState<LeaveRequest | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [processing, setProcessing] = useState(false);

    const branchOptions = useMemo(
        () => branches.filter((branch) => branch.status),
        [branches],
    );

    const loadRequests = useCallback(async () => {
        setLoading(true);

        try {
            const params = {
                page,
                limit: pageSize,
                status: statusFilter === 'all' ? undefined : statusFilter,
                branchId:
                    !employeeMode && branchFilter !== 'all'
                        ? branchFilter
                        : undefined,
                fromDate: fromDate || undefined,
                toDate: toDate || undefined,
                sortBy: 'createdAt' as const,
                sortOrder: 'DESC' as const,
            };
            const response = employeeMode
                ? await listMyLeaveRequests(params)
                : await listLeaveRequests(params);

            setRequests(response.data);
            setTotalPages(response.meta.totalPages);
        } catch (error) {
            showToast({
                title: 'Không thể tải đơn nghỉ',
                message: getLeaveRequestErrorMessage(error),
                variant: 'error',
            });
        } finally {
            setLoading(false);
        }
    }, [branchFilter, employeeMode, fromDate, page, showToast, statusFilter, toDate]);

    const loadFilters = useCallback(async () => {
        setFiltersLoading(true);

        try {
            if (employeeMode) {
                const employee = await getMyEmployee();
                setBranches(employee.branches);
                setEmployees([employee]);
                setFormValues((current) => ({
                    ...current,
                    employeeId: employee.id,
                    branchId: employee.branches[0]?.id ?? '',
                }));
                return;
            }

            const [branchResponse, employeeResponse] = await Promise.all([
                listBranches({
                    page: 1,
                    limit: 100,
                    sortBy: 'name',
                    sortOrder: 'ASC',
                }),
                listEmployees({
                    page: 1,
                    limit: 100,
                    sortBy: 'employeeCode',
                    sortOrder: 'ASC',
                }),
            ]);

            setBranches(branchResponse.data);
            setEmployees(employeeResponse.data);
        } catch (error) {
            showToast({
                title: 'Không thể tải bộ lọc',
                message: getLeaveRequestErrorMessage(error),
                variant: 'error',
            });
        } finally {
            setFiltersLoading(false);
        }
    }, [employeeMode, showToast]);

    const loadSchedules = useCallback(async () => {
        if (
            formValues.requestMode !== LeaveRequestMode.Shift ||
            !formValues.employeeId ||
            !formValues.branchId
        ) {
            setSchedules([]);
            return;
        }

        const params = {
            page: 1,
            limit: 100,
            employeeId: employeeMode ? undefined : formValues.employeeId,
            branchId: formValues.branchId,
            fromDate: formValues.startDate || today(),
            toDate: formValues.endDate || undefined,
            sortBy: 'workDate' as const,
            sortOrder: 'ASC' as const,
        };

        try {
            const response = employeeMode
                ? await listMyWorkSchedules(params)
                : await listWorkSchedules(params);
            setSchedules(response.data);
        } catch (error) {
            showToast({
                title: 'Không thể tải ca làm',
                message: getLeaveRequestErrorMessage(error),
                variant: 'error',
            });
        }
    }, [
        employeeMode,
        formValues.branchId,
        formValues.employeeId,
        formValues.endDate,
        formValues.requestMode,
        formValues.startDate,
        showToast,
    ]);

    useEffect(() => {
        void loadFilters();
    }, [loadFilters]);

    useEffect(() => {
        void loadRequests();
    }, [loadRequests]);

    useEffect(() => {
        void loadSchedules();
    }, [loadSchedules]);

    function resetForm() {
        setFormValues({
            ...initialFormValues,
            employeeId: employeeMode ? employees[0]?.id ?? '' : '',
            branchId: employeeMode ? branches[0]?.id ?? '' : '',
        });
        setSchedules([]);
    }

    function updateForm<TKey extends keyof FormValues>(
        key: TKey,
        value: FormValues[TKey],
    ) {
        setFormValues((current) => ({
            ...current,
            [key]: value,
            ...(key === 'employeeId' || key === 'branchId'
                ? { workScheduleIds: [] }
                : {}),
        }));
    }

    function toggleSchedule(scheduleId: string) {
        setFormValues((current) => ({
            ...current,
            workScheduleIds: current.workScheduleIds.includes(scheduleId)
                ? current.workScheduleIds.filter((id) => id !== scheduleId)
                : [...current.workScheduleIds, scheduleId],
        }));
    }

    async function handleCreate(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!formValues.branchId || !formValues.reason.trim()) {
            showToast({
                title: 'Thiếu thông tin',
                message: 'Chi nhánh và lý do là bắt buộc.',
                variant: 'error',
            });
            return;
        }

        if (!employeeMode && !formValues.employeeId) {
            showToast({
                title: 'Thiếu thông tin',
                message: 'Vui lòng chọn nhân viên.',
                variant: 'error',
            });
            return;
        }

        if (
            formValues.requestMode === LeaveRequestMode.Shift &&
            formValues.workScheduleIds.length === 0
        ) {
            showToast({
                title: 'Thiếu thông tin',
                message: 'Vui lòng chọn ít nhất một ca nghỉ.',
                variant: 'error',
            });
            return;
        }

        setSaving(true);

        try {
            const payload: LeaveRequestPayload = {
                employeeId: employeeMode ? undefined : formValues.employeeId,
                branchId: formValues.branchId,
                requestMode: formValues.requestMode,
                reason: formValues.reason.trim(),
                ...(formValues.requestMode === LeaveRequestMode.DateTime
                    ? {
                          startDate: formValues.startDate,
                          endDate: formValues.endDate,
                          isFullDay: formValues.isFullDay,
                          startTime: formValues.isFullDay
                              ? undefined
                              : formValues.startTime,
                          endTime: formValues.isFullDay
                              ? undefined
                              : formValues.endTime,
                      }
                    : {
                          workScheduleIds: formValues.workScheduleIds,
                      }),
            };

            await createLeaveRequest(payload);
            setShowForm(false);
            resetForm();
            await loadRequests();
            showToast({
                title: 'Thành công',
                message: 'Đã tạo đơn nghỉ.',
                variant: 'success',
            });
        } catch (error) {
            showToast({
                title: 'Không thể tạo đơn nghỉ',
                message: getLeaveRequestErrorMessage(error),
                variant: 'error',
            });
        } finally {
            setSaving(false);
        }
    }

    async function handleReview() {
        if (!reviewState || !reviewNote.trim()) return;
        setProcessing(true);

        try {
            if (reviewState.action === 'approve') {
                await approveLeaveRequest(reviewState.request.id, {
                    reviewNote: reviewNote.trim(),
                });
            } else {
                await rejectLeaveRequest(reviewState.request.id, {
                    reviewNote: reviewNote.trim(),
                });
            }

            setReviewState(null);
            setReviewNote('');
            await loadRequests();
            showToast({
                title: 'Thành công',
                message:
                    reviewState.action === 'approve'
                        ? 'Đã duyệt đơn nghỉ.'
                        : 'Đã từ chối đơn nghỉ.',
                variant: 'success',
            });
        } catch (error) {
            showToast({
                title: 'Không thể xử lý đơn nghỉ',
                message: getLeaveRequestErrorMessage(error),
                variant: 'error',
            });
        } finally {
            setProcessing(false);
        }
    }

    async function handleCancel() {
        if (!cancelTarget || !cancelReason.trim()) return;
        setProcessing(true);

        try {
            await cancelLeaveRequest(cancelTarget.id, {
                cancelReason: cancelReason.trim(),
            });
            setCancelTarget(null);
            setCancelReason('');
            await loadRequests();
            showToast({
                title: 'Thành công',
                message: 'Đã hủy đơn nghỉ.',
                variant: 'success',
            });
        } catch (error) {
            showToast({
                title: 'Không thể hủy đơn nghỉ',
                message: getLeaveRequestErrorMessage(error),
                variant: 'error',
            });
        } finally {
            setProcessing(false);
        }
    }

    return (
        <section className="mx-auto grid max-w-[1440px] gap-5 p-6 max-sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
                <div className="flex items-center gap-4">
                    <span className="flex size-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                        <FontAwesomeIcon icon={faCalendarMinus} />
                    </span>
                    <div>
                        <h2 className="text-xl font-bold text-slate-950">
                            {employeeMode ? 'Đơn nghỉ của tôi' : 'Quản lý đơn nghỉ'}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Tạo, theo dõi, duyệt và hủy đơn nghỉ theo ngày/giờ hoặc theo ca.
                        </p>
                    </div>
                </div>
                <Button
                    disabled={filtersLoading}
                    onClick={() => {
                        resetForm();
                        setShowForm(true);
                    }}
                    size="lg"
                >
                    <FontAwesomeIcon icon={faCalendarMinus} />
                    Tạo đơn nghỉ
                </Button>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <LoadingOverlay label="Đang tải đơn nghỉ..." visible={loading} />
                <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
                    <DropdownSelect
                        ariaLabel="Trạng thái"
                        options={[
                            { value: 'all', label: 'Tất cả trạng thái' },
                            { value: LeaveRequestStatus.Pending, label: 'Chờ duyệt' },
                            { value: LeaveRequestStatus.Approved, label: 'Đã duyệt' },
                            { value: LeaveRequestStatus.Rejected, label: 'Đã từ chối' },
                            { value: LeaveRequestStatus.Cancelled, label: 'Đã hủy' },
                        ]}
                        value={statusFilter}
                        onChange={(value) => {
                            setStatusFilter(value as LeaveRequestStatusFilter);
                            setPage(1);
                        }}
                    />
                    {!employeeMode && (
                        <DropdownSelect
                            ariaLabel="Chi nhánh"
                            disabled={filtersLoading}
                            options={[
                                { value: 'all', label: 'Tất cả chi nhánh' },
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
                    <input
                        className={`${fieldClass} max-w-40`}
                        type="date"
                        value={fromDate}
                        onChange={(event) => {
                            setFromDate(event.target.value);
                            setPage(1);
                        }}
                    />
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
                        Làm mới
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1080px] table-fixed">
                        <thead className="bg-slate-50">
                            <tr className="border-b border-slate-200">
                                <th className="w-[13%] px-4 py-3 text-center text-xs text-slate-600">Mã đơn</th>
                                <th className="w-[19%] px-4 py-3 text-center text-xs text-slate-600">Nhân viên</th>
                                <th className="w-[13%] px-4 py-3 text-center text-xs text-slate-600">Chi nhánh</th>
                                <th className="w-[12%] px-4 py-3 text-center text-xs text-slate-600">Hình thức</th>
                                <th className="w-[17%] px-4 py-3 text-center text-xs text-slate-600">Thời gian/Ca</th>
                                <th className="w-[11%] px-4 py-3 text-center text-xs text-slate-600">Trạng thái</th>
                                <th className="w-[15%] px-4 py-3 text-center text-xs text-slate-600">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading &&
                                requests.map((request) => (
                                    <tr
                                        className="border-b border-slate-100 hover:bg-slate-50"
                                        key={request.id}
                                    >
                                        <td className="px-4 py-3 text-center text-sm font-semibold text-slate-800">
                                            {request.code}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-700">
                                            {formatEmployee(request.employee)}
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm text-slate-600">
                                            {request.branch.name}
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm text-slate-600">
                                            {request.requestMode === LeaveRequestMode.Shift
                                                ? 'Theo ca'
                                                : 'Theo ngày/giờ'}
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm text-slate-600">
                                            {formatLeaveTime(request)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(request.status)}`}>
                                                {statusLabel(request.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-center gap-2">
                                                {!employeeMode &&
                                                    request.status === LeaveRequestStatus.Pending && (
                                                        <>
                                                            <IconButton
                                                                label="Duyệt"
                                                                onClick={() => {
                                                                    setReviewState({ request, action: 'approve' });
                                                                    setReviewNote('');
                                                                }}
                                                            >
                                                                <FontAwesomeIcon icon={faCheck} />
                                                            </IconButton>
                                                            <IconButton
                                                                label="Từ chối"
                                                                tone="danger"
                                                                onClick={() => {
                                                                    setReviewState({ request, action: 'reject' });
                                                                    setReviewNote('');
                                                                }}
                                                            >
                                                                <FontAwesomeIcon icon={faXmark} />
                                                            </IconButton>
                                                        </>
                                                    )}
                                                {(request.status === LeaveRequestStatus.Pending ||
                                                    (!employeeMode && request.status === LeaveRequestStatus.Approved)) && (
                                                    <IconButton
                                                        label="Hủy"
                                                        tone="warning"
                                                        onClick={() => {
                                                            setCancelTarget(request);
                                                            setCancelReason('');
                                                        }}
                                                    >
                                                        <FontAwesomeIcon icon={faBan} />
                                                    </IconButton>
                                                )}
                                                <IconButton
                                                    label="Xem"
                                                    onClick={() => setSelectedRequest(request)}
                                                >
                                                    <FontAwesomeIcon icon={faEye} />
                                                </IconButton>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                {!loading && requests.length === 0 && (
                    <EmptyState
                        description="Thử thay đổi khoảng ngày, trạng thái hoặc chi nhánh."
                        title="Chưa có đơn nghỉ phù hợp"
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
                description="Nhập thông tin nghỉ theo ngày/giờ hoặc chọn ca đã được phân công."
                open={showForm}
                panelClassName="max-w-2xl"
                title="Tạo đơn nghỉ"
                onClose={() => !saving && setShowForm(false)}
            >
                <form className="mt-5 grid gap-4" onSubmit={handleCreate}>
                    {!employeeMode && (
                        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                            Nhân viên
                            <div className="dropdown-select-field">
                                <DropdownSelect
                                    ariaLabel="Nhân viên"
                                    disabled={filtersLoading}
                                    options={employees.map((employee) => ({
                                        value: employee.id,
                                        label: formatEmployee(employee),
                                    }))}
                                    placeholder="Chọn nhân viên"
                                    value={formValues.employeeId}
                                    onChange={(value) => updateForm('employeeId', value)}
                                />
                            </div>
                        </label>
                    )}

                    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                        Chi nhánh
                        <div className="dropdown-select-field">
                            <DropdownSelect
                                ariaLabel="Chi nhánh"
                                disabled={filtersLoading}
                                options={branchOptions.map((branch) => ({
                                    value: branch.id,
                                    label: branch.name,
                                }))}
                                placeholder="Chọn chi nhánh"
                                value={formValues.branchId}
                                onChange={(value) => updateForm('branchId', value)}
                            />
                        </div>
                    </label>

                    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                        Hình thức nghỉ
                        <div className="dropdown-select-field">
                            <DropdownSelect
                                ariaLabel="Hình thức nghỉ"
                                options={[
                                    { value: LeaveRequestMode.DateTime, label: 'Theo ngày/giờ' },
                                    { value: LeaveRequestMode.Shift, label: 'Theo ca' },
                                ]}
                                value={formValues.requestMode}
                                onChange={(value) => updateForm('requestMode', value)}
                            />
                        </div>
                    </label>

                    <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                            Từ ngày
                            <input
                                className={fieldClass}
                                type="date"
                                value={formValues.startDate}
                                onChange={(event) => updateForm('startDate', event.target.value)}
                            />
                        </label>
                        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                            Đến ngày
                            <input
                                className={fieldClass}
                                type="date"
                                value={formValues.endDate}
                                onChange={(event) => updateForm('endDate', event.target.value)}
                            />
                        </label>
                    </div>

                    {formValues.requestMode === LeaveRequestMode.DateTime && (
                        <>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                <input
                                    checked={formValues.isFullDay}
                                    type="checkbox"
                                    onChange={(event) => updateForm('isFullDay', event.target.checked)}
                                />
                                Nghỉ cả ngày
                            </label>
                            {!formValues.isFullDay && (
                                <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                                    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                                        Giờ bắt đầu
                                        <input
                                            className={fieldClass}
                                            type="time"
                                            value={formValues.startTime}
                                            onChange={(event) => updateForm('startTime', event.target.value)}
                                        />
                                    </label>
                                    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                                        Giờ kết thúc
                                        <input
                                            className={fieldClass}
                                            type="time"
                                            value={formValues.endTime}
                                            onChange={(event) => updateForm('endTime', event.target.value)}
                                        />
                                    </label>
                                </div>
                            )}
                        </>
                    )}

                    {formValues.requestMode === LeaveRequestMode.Shift && (
                        <div className="grid gap-2">
                            <div className="text-sm font-medium text-slate-700">
                                Ca được phân công
                            </div>
                            <div className="grid max-h-52 gap-2 overflow-y-auto rounded-lg border border-slate-200 p-2">
                                {schedules.length === 0 ? (
                                    <p className="px-2 py-4 text-center text-sm text-slate-500">
                                        Không có ca phù hợp trong khoảng ngày đã chọn.
                                    </p>
                                ) : (
                                    schedules.map((schedule) => (
                                        <label
                                            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-slate-50"
                                            key={schedule.id}
                                        >
                                            <input
                                                checked={formValues.workScheduleIds.includes(schedule.id)}
                                                type="checkbox"
                                                onChange={() => toggleSchedule(schedule.id)}
                                            />
                                            <span>{formatSchedule(schedule)}</span>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                        Lý do
                        <textarea
                            className={`${fieldClass} min-h-24 py-3`}
                            maxLength={1000}
                            value={formValues.reason}
                            onChange={(event) => updateForm('reason', event.target.value)}
                        />
                    </label>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            disabled={saving}
                            onClick={() => setShowForm(false)}
                            variant="secondary"
                        >
                            Hủy
                        </Button>
                        <Button loading={saving} type="submit">
                            Lưu
                        </Button>
                    </div>
                </form>
            </DialogShell>

            <ReasonDialog
                description="Lý do xử lý là bắt buộc."
                loading={processing}
                open={Boolean(reviewState)}
                title={reviewState?.action === 'approve' ? 'Duyệt đơn nghỉ' : 'Từ chối đơn nghỉ'}
                value={reviewNote}
                onClose={() => {
                    setReviewState(null);
                    setReviewNote('');
                }}
                onConfirm={() => void handleReview()}
                onValueChange={setReviewNote}
            />

            <ReasonDialog
                description="Hệ thống chỉ chuyển đơn sang trạng thái đã hủy; Manager/Admin tự xử lý lại lịch nếu cần."
                loading={processing}
                open={Boolean(cancelTarget)}
                title="Hủy đơn nghỉ"
                value={cancelReason}
                onClose={() => {
                    setCancelTarget(null);
                    setCancelReason('');
                }}
                onConfirm={() => void handleCancel()}
                onValueChange={setCancelReason}
            />

            <DialogShell
                description="Thông tin đơn nghỉ và các ca bị ảnh hưởng."
                open={Boolean(selectedRequest)}
                panelClassName="max-w-xl"
                title="Chi tiết đơn nghỉ"
                onClose={() => setSelectedRequest(null)}
            >
                {selectedRequest && (
                    <div className="mt-5 grid max-h-[62vh] gap-3 overflow-y-auto pr-1 text-sm">
                        <DetailRow label="Mã đơn" value={selectedRequest.code} />
                        <DetailRow
                            label="Nhân viên"
                            value={formatEmployee(selectedRequest.employee)}
                        />
                        <DetailRow label="Chi nhánh" value={selectedRequest.branch.name} />
                        <DetailRow
                            label="Hình thức"
                            value={
                                selectedRequest.requestMode === LeaveRequestMode.Shift
                                    ? 'Theo ca'
                                    : 'Theo ngày/giờ'
                            }
                        />
                        <DetailRow
                            label="Thời gian"
                            value={formatLeaveTime(selectedRequest)}
                        />
                        <DetailRow
                            label="Trạng thái"
                            value={statusLabel(selectedRequest.status)}
                        />
                        <DetailRow label="Lý do" value={selectedRequest.reason} />
                        <DetailRow
                            label="Ghi chú xử lý"
                            value={selectedRequest.reviewNote || '-'}
                        />
                        <DetailRow
                            label="Lý do hủy"
                            value={selectedRequest.cancelReason || '-'}
                        />
                        <div className="grid gap-1 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                            <span className="text-xs font-semibold uppercase text-slate-500">
                                Ca bị ảnh hưởng
                            </span>
                            {selectedRequest.assignments.length === 0 ? (
                                <span className="text-slate-700">-</span>
                            ) : (
                                <ul className="grid gap-1 text-slate-700">
                                    {selectedRequest.assignments.map((assignment) => (
                                        <li key={assignment.id}>
                                            {formatSchedule(assignment.workSchedule)}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button
                                onClick={() => setSelectedRequest(null)}
                                variant="secondary"
                            >
                                Đóng
                            </Button>
                        </div>
                    </div>
                )}
            </DialogShell>
        </section>
    );
}

function IconButton({
    children,
    label,
    onClick,
    tone = 'primary',
}: {
    children: ReactNode;
    label: string;
    onClick: () => void;
    tone?: 'primary' | 'danger' | 'warning';
}) {
    const toneClass =
        tone === 'danger'
            ? 'border-red-100 bg-red-50 text-red-600 hover:border-red-300 hover:bg-red-600'
            : tone === 'warning'
              ? 'border-amber-100 bg-amber-50 text-amber-600 hover:border-amber-300 hover:bg-amber-600'
              : 'border-primary-100 bg-primary-50 text-primary-600 hover:border-primary-300 hover:bg-primary-600';

    return (
        <button
            aria-label={label}
            className={`flex size-9 min-h-0 cursor-pointer items-center justify-center rounded-lg border p-0 transition hover:text-white ${toneClass}`}
            onClick={onClick}
            title={label}
            type="button"
        >
            {children}
        </button>
    );
}

function ReasonDialog({
    description,
    loading,
    open,
    title,
    value,
    onClose,
    onConfirm,
    onValueChange,
}: {
    description: string;
    loading: boolean;
    open: boolean;
    title: string;
    value: string;
    onClose: () => void;
    onConfirm: () => void;
    onValueChange: (value: string) => void;
}) {
    return (
        <DialogShell
            description={description}
            open={open}
            title={title}
            onClose={() => !loading && onClose()}
        >
            <div className="mt-5 grid gap-4">
                <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                    Lý do
                    <textarea
                        className={`${fieldClass} min-h-24 py-3`}
                        maxLength={1000}
                        value={value}
                        onChange={(event) => onValueChange(event.target.value)}
                    />
                </label>
                <div className="flex justify-end gap-3 pt-2">
                    <Button disabled={loading} onClick={onClose} variant="secondary">
                        Hủy
                    </Button>
                    <Button
                        disabled={!value.trim()}
                        loading={loading}
                        onClick={onConfirm}
                    >
                        Xác nhận
                    </Button>
                </div>
            </div>
        </DialogShell>
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
