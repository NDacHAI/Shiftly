import { useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowsRotate,
    faCalculator,
    faCheck,
    faEye,
    faFileInvoiceDollar,
    faLock,
    faRotateRight,
    faSearch,
} from '@fortawesome/free-solid-svg-icons';
import { ConfirmDialog, useToast } from '@/components/feedback';
import {
    Button,
    DropdownSelect,
    EmptyState,
    fieldClass,
    IconButton,
    LoadingOverlay,
    PageHeader,
    Pagination,
} from '@/components/ui';
import { listPayrollPeriods } from '@/features/payroll-periods/api/payroll-periods.api';
import {
    type PayrollPeriod,
    PayrollPeriodStatus,
} from '@/features/payroll-periods/types';
import { useDebounce } from '@/hooks/useDebounce';
import { useI18n } from '@/i18n';
import {
    closePayrollProcessing,
    generatePayrollProcessing,
    getPayrollProcessingErrorKey,
    listEmployeePayrolls,
    listPayrollProcessings,
    recalculatePayrollProcessing,
    retryEmployeePayroll,
} from '../api/payroll-processings.api';
import {
    type EmployeePayroll,
    type EmployeePayrollSortField,
    EmployeePayrollStatus,
    type EmployeePayrollStatusFilter,
    type PayrollProcessing,
    type PayrollProcessingSortField,
    PayrollProcessingStatus,
    type PayrollProcessingStatusFilter,
    type SortOrder,
} from '../types';

const pageSize = 10;
const detailPageSize = 8;
type PayrollProcessingsPageProps = {
    canManage: boolean;
};

function processingStatusFromFilter(filter: PayrollProcessingStatusFilter) {
    if (filter === 'draft') return PayrollProcessingStatus.Draft;
    if (filter === 'processing') return PayrollProcessingStatus.Processing;
    if (filter === 'completed') return PayrollProcessingStatus.Completed;
    if (filter === 'failed') return PayrollProcessingStatus.Failed;
    if (filter === 'closed') return PayrollProcessingStatus.Closed;
    return undefined;
}

function employeeStatusFromFilter(filter: EmployeePayrollStatusFilter) {
    if (filter === 'success') return EmployeePayrollStatus.Success;
    if (filter === 'failed') return EmployeePayrollStatus.Failed;
    if (filter === 'finalized') return EmployeePayrollStatus.Finalized;
    return undefined;
}

function formatDateTime(value: string | null) {
    if (!value) return '-';
    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(value));
}

function formatMoney(value: string) {
    return new Intl.NumberFormat('vi-VN').format(Number(value));
}

function formatMinutes(value: number) {
    const hours = Math.floor(value / 60);
    const minutes = value % 60;

    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
}

export function PayrollProcessingsPage({
    canManage,
}: PayrollProcessingsPageProps) {
    const { showToast } = useToast();
    const { t } = useI18n();
    const [processings, setProcessings] = useState<PayrollProcessing[]>([]);
    const [employeePayrolls, setEmployeePayrolls] = useState<EmployeePayroll[]>([]);
    const [openPeriods, setOpenPeriods] = useState<PayrollPeriod[]>([]);
    const [selectedPeriodId, setSelectedPeriodId] = useState('');
    const [selectedProcessing, setSelectedProcessing] =
        useState<PayrollProcessing | null>(null);
    const [processingToClose, setProcessingToClose] =
        useState<PayrollProcessing | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [detailPage, setDetailPage] = useState(1);
    const [detailTotalPages, setDetailTotalPages] = useState(0);
    const [search, setSearch] = useState('');
    const [detailSearch, setDetailSearch] = useState('');
    const debouncedSearch = useDebounce(search);
    const debouncedDetailSearch = useDebounce(detailSearch);
    const [statusFilter, setStatusFilter] =
        useState<PayrollProcessingStatusFilter>('all');
    const [employeeStatusFilter, setEmployeeStatusFilter] =
        useState<EmployeePayrollStatusFilter>('all');
    const [sortBy, setSortBy] =
        useState<PayrollProcessingSortField>('createdAt');
    const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');
    const [detailSortBy, setDetailSortBy] =
        useState<EmployeePayrollSortField>('employeeCode');
    const [detailSortOrder, setDetailSortOrder] = useState<SortOrder>('ASC');
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [processingAction, setProcessingAction] = useState(false);
    const [error, setError] = useState('');

    const loadProcessings = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const response = await listPayrollProcessings({
                page,
                limit: pageSize,
                search: debouncedSearch || undefined,
                status: processingStatusFromFilter(statusFilter),
                sortBy,
                sortOrder,
            });
            setProcessings(response.data);
            setTotalPages(response.meta.totalPages);

            if (
                response.meta.totalPages > 0 &&
                page > response.meta.totalPages
            ) {
                setPage(response.meta.totalPages);
            }
        } catch (loadError) {
            setError(t(getPayrollProcessingErrorKey(loadError)));
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, page, sortBy, sortOrder, statusFilter]);

    const loadEmployeePayrolls = useCallback(async () => {
        if (!selectedProcessing) {
            setEmployeePayrolls([]);
            return;
        }

        setDetailLoading(true);

        try {
            const response = await listEmployeePayrolls(selectedProcessing.id, {
                page: detailPage,
                limit: detailPageSize,
                search: debouncedDetailSearch || undefined,
                status: employeeStatusFromFilter(employeeStatusFilter),
                sortBy: detailSortBy,
                sortOrder: detailSortOrder,
            });
            setEmployeePayrolls(response.data);
            setDetailTotalPages(response.meta.totalPages);

            if (
                response.meta.totalPages > 0 &&
                detailPage > response.meta.totalPages
            ) {
                setDetailPage(response.meta.totalPages);
            }
        } catch (loadError) {
            setError(t(getPayrollProcessingErrorKey(loadError)));
        } finally {
            setDetailLoading(false);
        }
    }, [
        debouncedDetailSearch,
        detailPage,
        detailSortBy,
        detailSortOrder,
        employeeStatusFilter,
        selectedProcessing,
    ]);

    useEffect(() => {
        void loadProcessings();
    }, [loadProcessings]);

    useEffect(() => {
        void loadEmployeePayrolls();
    }, [loadEmployeePayrolls]);

    useEffect(() => {
        async function loadOpenPeriods() {
            try {
                const response = await listPayrollPeriods({
                    page: 1,
                    limit: 100,
                    status: PayrollPeriodStatus.Open,
                    sortBy: 'createdAt',
                    sortOrder: 'DESC',
                });
                setOpenPeriods(response.data);
                setSelectedPeriodId((current) => current || response.data[0]?.id || '');
            } catch (loadError) {
                setError(t(getPayrollProcessingErrorKey(loadError)));
            }
        }

        void loadOpenPeriods();
    }, []);

    async function handleGenerate() {
        if (!selectedPeriodId) return;

        setProcessingAction(true);
        setError('');

        try {
            const processing = await generatePayrollProcessing(selectedPeriodId);
            setSelectedProcessing(processing);
            await loadProcessings();
            showToast({
                message: t('payrollProcessings.generated'),
                title: t('common.success'),
                variant: 'success',
            });
        } catch (generateError) {
            const message = t(getPayrollProcessingErrorKey(generateError));
            setError(message);
            showToast({
                message,
                title: t('payrollProcessings.actionError'),
                variant: 'error',
            });
        } finally {
            setProcessingAction(false);
        }
    }

    async function handleRecalculate(processing: PayrollProcessing) {
        setProcessingAction(true);
        setError('');

        try {
            const updated = await recalculatePayrollProcessing(processing.id);
            setSelectedProcessing(updated);
            await loadProcessings();
            showToast({
                message: t('payrollProcessings.recalculated'),
                title: t('common.success'),
                variant: 'success',
            });
        } catch (recalculateError) {
            const message = t(getPayrollProcessingErrorKey(recalculateError));
            setError(message);
            showToast({
                message,
                title: t('payrollProcessings.actionError'),
                variant: 'error',
            });
        } finally {
            setProcessingAction(false);
        }
    }

    async function handleConfirmClose() {
        if (!processingToClose) return;

        setProcessingAction(true);
        setError('');

        try {
            const updated = await closePayrollProcessing(processingToClose.id);
            setProcessingToClose(null);
            setSelectedProcessing(updated);
            await loadProcessings();
            showToast({
                message: t('payrollProcessings.closedMessage'),
                title: t('common.success'),
                variant: 'success',
            });
        } catch (closeError) {
            const message = t(getPayrollProcessingErrorKey(closeError));
            setError(message);
            showToast({
                message,
                title: t('payrollProcessings.actionError'),
                variant: 'error',
            });
        } finally {
            setProcessingAction(false);
        }
    }

    async function handleRetry(employeePayroll: EmployeePayroll) {
        setProcessingAction(true);
        setError('');

        try {
            await retryEmployeePayroll(employeePayroll.id);
            await Promise.all([loadEmployeePayrolls(), loadProcessings()]);
            showToast({
                message: t('payrollProcessings.employeeRetried'),
                title: t('common.success'),
                variant: 'success',
            });
        } catch (retryError) {
            const message = t(getPayrollProcessingErrorKey(retryError));
            setError(message);
            showToast({
                message,
                title: t('payrollProcessings.actionError'),
                variant: 'error',
            });
        } finally {
            setProcessingAction(false);
        }
    }

    function changeSort(field: PayrollProcessingSortField) {
        if (sortBy === field) {
            setSortOrder((current) => (current === 'ASC' ? 'DESC' : 'ASC'));
        } else {
            setSortBy(field);
            setSortOrder('ASC');
        }
        setPage(1);
    }

    function changeDetailSort(field: EmployeePayrollSortField) {
        if (detailSortBy === field) {
            setDetailSortOrder((current) =>
                current === 'ASC' ? 'DESC' : 'ASC',
            );
        } else {
            setDetailSortBy(field);
            setDetailSortOrder('ASC');
        }
        setDetailPage(1);
    }

    function sortLabel(field: PayrollProcessingSortField) {
        if (sortBy !== field) return '';
        return sortOrder === 'ASC' ? ' ^' : ' v';
    }

    function detailSortLabel(field: EmployeePayrollSortField) {
        if (detailSortBy !== field) return '';
        return detailSortOrder === 'ASC' ? ' ^' : ' v';
    }

    function processingStatusLabel(status: PayrollProcessingStatus) {
        const keys = {
            [PayrollProcessingStatus.Draft]: 'payrollProcessings.draft',
            [PayrollProcessingStatus.Processing]: 'payrollProcessings.processing',
            [PayrollProcessingStatus.Completed]: 'payrollProcessings.completed',
            [PayrollProcessingStatus.Failed]: 'payrollProcessings.failed',
            [PayrollProcessingStatus.Closed]: 'payrollProcessings.closed',
        } as const;

        return t(keys[status]);
    }

    function employeeStatusLabel(status: EmployeePayrollStatus) {
        const keys = {
            [EmployeePayrollStatus.Success]: 'payrollProcessings.success',
            [EmployeePayrollStatus.Failed]: 'payrollProcessings.failed',
            [EmployeePayrollStatus.Finalized]: 'payrollProcessings.finalized',
        } as const;

        return t(keys[status]);
    }

    function statusClass(status: PayrollProcessingStatus | EmployeePayrollStatus) {
        if (
            status === PayrollProcessingStatus.Completed ||
            status === EmployeePayrollStatus.Success
        ) {
            return 'bg-emerald-50 text-emerald-700';
        }

        if (
            status === PayrollProcessingStatus.Failed ||
            status === EmployeePayrollStatus.Failed
        ) {
            return 'bg-red-50 text-red-700';
        }

        if (
            status === PayrollProcessingStatus.Closed ||
            status === EmployeePayrollStatus.Finalized
        ) {
            return 'bg-slate-100 text-slate-700';
        }

        return 'bg-amber-50 text-amber-700';
    }

    return (
        <section className="mx-auto grid max-w-[1440px] gap-5 p-6 max-sm:p-4">
            <PageHeader
                actions={canManage && (
                    <div className="flex items-center gap-3 max-sm:flex-col">
                        <DropdownSelect
                            ariaLabel={t('payrollProcessings.period')}
                            className="min-w-64 max-sm:w-full"
                            options={openPeriods.map((period) => ({
                                value: period.id,
                                label: period.name,
                            }))}
                            placeholder={t('payrollProcessings.selectOpenPeriod')}
                            value={selectedPeriodId}
                            onChange={setSelectedPeriodId}
                        />
                        <Button
                            className="shadow-sm max-sm:w-full"
                            disabled={!selectedPeriodId || processingAction}
                            onClick={() => void handleGenerate()}
                            size="lg"
                        >
                            <FontAwesomeIcon icon={faCalculator} />
                            {t('payrollProcessings.generate')}
                        </Button>
                    </div>
                )}
                description={t('payrollProcessings.subtitle')}
                icon={<FontAwesomeIcon icon={faFileInvoiceDollar} />}
                title={t('payrollProcessings.title')}
            />

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="relative overflow-hidden rounded-xl border border-line bg-white shadow-card">
                <LoadingOverlay
                    label={t('payrollProcessings.loading')}
                    visible={loading}
                />
                <div className="flex items-center justify-between gap-4 border-b border-slate-200 p-4 max-lg:items-stretch max-lg:flex-col">
                    <label className="relative block w-full max-w-sm">
                        <span className="sr-only">{t('common.search')}</span>
                        <FontAwesomeIcon
                            className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400"
                            icon={faSearch}
                        />
                        <input
                            aria-label={t('common.search')}
                            className={`${fieldClass} pl-9`}
                            placeholder={t('payrollProcessings.searchPlaceholder')}
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                        />
                    </label>

                    <div className="flex items-center gap-3 max-sm:flex-col">
                        <DropdownSelect
                            ariaLabel={t('common.status')}
                            className="max-sm:w-full"
                            options={[
                                { value: 'all', label: t('common.allStatuses') },
                                { value: 'completed', label: t('payrollProcessings.completed') },
                                { value: 'failed', label: t('payrollProcessings.failed') },
                                { value: 'closed', label: t('payrollProcessings.closed') },
                            ]}
                            value={statusFilter}
                            onChange={(value) => {
                                setStatusFilter(
                                    value as PayrollProcessingStatusFilter,
                                );
                                setPage(1);
                            }}
                        />
                        <Button
                            className="max-sm:w-full"
                            onClick={() => void loadProcessings()}
                            size="lg"
                            variant="secondary"
                        >
                            <FontAwesomeIcon icon={faRotateRight} />
                            {t('common.refresh')}
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="data-table w-full min-w-[1180px] table-fixed border-collapse">
                        <thead>
                            <tr>
                                <th>
                                    {t('payrollProcessings.period')}
                                </th>
                                {(
                                    [
                                        ['totalEmployees', t('payrollProcessings.totalEmployees')],
                                        ['processedEmployees', t('payrollProcessings.processedEmployees')],
                                        ['successCount', t('payrollProcessings.successCount')],
                                        ['failedCount', t('payrollProcessings.failedCount')],
                                        ['status', t('common.status')],
                                        ['generatedAt', t('payrollProcessings.generatedAt')],
                                    ] as const
                                ).map(([field, label]) => (
                                    <th
                                        key={field}
                                    >
                                        <button
                                            className="min-h-0 cursor-pointer bg-transparent p-0 text-inherit hover:text-primary-600"
                                            onClick={() => changeSort(field)}
                                            type="button"
                                        >
                                            {label}
                                            {sortLabel(field)}
                                        </button>
                                    </th>
                                ))}
                                <th className="cell-actions">
                                    {t('common.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading &&
                                processings.map((processing) => (
                                    <tr
                                        className="border-b border-slate-100 transition hover:bg-slate-50/80 last:border-0"
                                        key={processing.id}
                                    >
                                        <td className="font-semibold text-slate-900">
                                            {processing.payrollPeriod.name}
                                        </td>
                                        <td>
                                            {processing.totalEmployees}
                                        </td>
                                        <td>
                                            {processing.processedEmployees}
                                        </td>
                                        <td className="text-emerald-700">
                                            {processing.successCount}
                                        </td>
                                        <td className="text-red-700">
                                            {processing.failedCount}
                                        </td>
                                        <td>
                                            <span
                                                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-current/15 ring-inset ${statusClass(processing.status)}`}
                                            >
                                                {processingStatusLabel(processing.status)}
                                            </span>
                                        </td>
                                        <td>
                                            {formatDateTime(processing.generatedAt)}
                                        </td>
                                        <td className="cell-actions">
                                            <div className="flex items-center justify-end gap-1">
                                                <IconButton
                                                    icon={faEye}
                                                    label={t('common.view')}
                                                    onClick={() => {
                                                        setSelectedProcessing(processing);
                                                        setDetailPage(1);
                                                    }}
                                                />
                                                {canManage &&
                                                    processing.status !==
                                                        PayrollProcessingStatus.Closed && (
                                                        <IconButton
                                                            icon={faArrowsRotate}
                                                            label={t('payrollProcessings.recalculate')}
                                                            onClick={() =>
                                                                void handleRecalculate(
                                                                    processing,
                                                                )
                                                            }
                                                            tone="primary"
                                                        />
                                                    )}
                                                {canManage &&
                                                    processing.status ===
                                                        PayrollProcessingStatus.Completed && (
                                                        <IconButton
                                                            icon={faLock}
                                                            label={t('payrollProcessings.closeAction')}
                                                            onClick={() =>
                                                                setProcessingToClose(
                                                                    processing,
                                                                )
                                                            }
                                                        />
                                                    )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            {!loading && processings.length === 0 && (
                                <tr>
                                    <td colSpan={8}>
                                        <EmptyState
                                            description={t(
                                                'payrollProcessings.noResultsDescription',
                                            )}
                                            icon={
                                                <FontAwesomeIcon
                                                    icon={faFileInvoiceDollar}
                                                />
                                            }
                                            title={t(
                                                'payrollProcessings.noResultsTitle',
                                            )}
                                        />
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    page={page}
                    pageSize={pageSize}
                    totalPages={totalPages}
                    onPageChange={setPage}
                />
            </div>

            {selectedProcessing && (
                <div className="relative overflow-hidden rounded-xl border border-line bg-white shadow-card">
                    <LoadingOverlay
                        label={t('payrollProcessings.employeeLoading')}
                        visible={detailLoading}
                    />
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 p-4 max-lg:items-stretch max-lg:flex-col">
                        <div>
                            <h3 className="text-base font-bold text-slate-950">
                                {t('payrollProcessings.employeePayrolls')}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                                {selectedProcessing.payrollPeriod.name}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 max-sm:flex-col">
                            <label className="relative block w-72 max-sm:w-full">
                                <span className="sr-only">{t('common.search')}</span>
                                <FontAwesomeIcon
                                    className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400"
                                    icon={faSearch}
                                />
                                <input
                                    aria-label={t('common.search')}
                                    className={`${fieldClass} pl-9`}
                                    placeholder={t(
                                        'payrollProcessings.employeeSearchPlaceholder',
                                    )}
                                    value={detailSearch}
                                    onChange={(event) => {
                                        setDetailSearch(event.target.value);
                                        setDetailPage(1);
                                    }}
                                />
                            </label>
                            <DropdownSelect
                                ariaLabel={t('common.status')}
                                className="max-sm:w-full"
                                options={[
                                    { value: 'all', label: t('common.allStatuses') },
                                    { value: 'success', label: t('payrollProcessings.success') },
                                    { value: 'failed', label: t('payrollProcessings.failed') },
                                    { value: 'finalized', label: t('payrollProcessings.finalized') },
                                ]}
                                value={employeeStatusFilter}
                                onChange={(value) => {
                                    setEmployeeStatusFilter(
                                        value as EmployeePayrollStatusFilter,
                                    );
                                    setDetailPage(1);
                                }}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="data-table w-full min-w-[1280px] table-fixed border-collapse">
                            <thead>
                                <tr>
                                    {(
                                        [
                                            ['employeeCode', t('payrollProcessings.employee')],
                                            ['status', t('common.status')],
                                            ['grossPay', t('payrollProcessings.grossPay')],
                                            ['netPay', t('payrollProcessings.netPay')],
                                        ] as const
                                    ).map(([field, label]) => (
                                        <th
                                            key={field}
                                        >
                                            <button
                                                className="min-h-0 cursor-pointer bg-transparent p-0 text-inherit hover:text-primary-600"
                                                onClick={() =>
                                                    changeDetailSort(field)
                                                }
                                                type="button"
                                            >
                                                {label}
                                                {detailSortLabel(field)}
                                            </button>
                                        </th>
                                    ))}
                                    <th>
                                        {t('payrollProcessings.branch')}
                                    </th>
                                    <th>
                                        {t('payrollProcessings.position')}
                                    </th>
                                    <th>
                                        {t('payrollProcessings.minutes')}
                                    </th>
                                    <th>
                                        {t('payrollProcessings.adjustments')}
                                    </th>
                                    <th className="cell-actions">
                                        {t('common.actions')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {!detailLoading &&
                                    employeePayrolls.map((employeePayroll) => (
                                        <tr
                                            className="border-b border-slate-100 transition hover:bg-slate-50/80 last:border-0"
                                            key={employeePayroll.id}
                                        >
                                            <td className="font-semibold text-slate-900">
                                                {employeePayroll.employeeCode} -{' '}
                                                {employeePayroll.employeeName}
                                            </td>
                                            <td>
                                                <span
                                                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-current/15 ring-inset ${statusClass(employeePayroll.status)}`}
                                                >
                                                    {employeeStatusLabel(
                                                        employeePayroll.status,
                                                    )}
                                                </span>
                                            </td>
                                            <td>
                                                {formatMoney(employeePayroll.grossPay)}
                                            </td>
                                            <td className="font-semibold text-slate-900">
                                                {formatMoney(employeePayroll.netPay)}
                                            </td>
                                            <td>
                                                {employeePayroll.branchName}
                                            </td>
                                            <td>
                                                {employeePayroll.positionName}
                                            </td>
                                            <td>
                                                {formatMinutes(
                                                    employeePayroll.workedMinutes,
                                                )}{' '}
                                                /{' '}
                                                {formatMinutes(
                                                    employeePayroll.overtimeMinutes,
                                                )}
                                            </td>
                                            <td>
                                                +{formatMoney(
                                                    employeePayroll.rewardTotal,
                                                )}{' '}
                                                / -
                                                {formatMoney(
                                                    employeePayroll.penaltyTotal,
                                                )}
                                            </td>
                                            <td className="cell-actions">
                                                <div className="flex items-center justify-end gap-1">
                                                    {employeePayroll.status ===
                                                        EmployeePayrollStatus.Failed && (
                                                        <IconButton
                                                            icon={faArrowsRotate}
                                                            label={t('payrollProcessings.retry')}
                                                            onClick={() =>
                                                                void handleRetry(
                                                                    employeePayroll,
                                                                )
                                                            }
                                                            tone="warning"
                                                        />
                                                    )}
                                                    {employeePayroll.status !==
                                                        EmployeePayrollStatus.Failed && (
                                                        <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                                            <FontAwesomeIcon icon={faCheck} />
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                {!detailLoading && employeePayrolls.length === 0 && (
                                    <tr>
                                        <td colSpan={9}>
                                            <EmptyState
                                                description={t(
                                                    'payrollProcessings.employeeNoResultsDescription',
                                                )}
                                                icon={
                                                    <FontAwesomeIcon
                                                        icon={faFileInvoiceDollar}
                                                    />
                                                }
                                                title={t(
                                                    'payrollProcessings.employeeNoResultsTitle',
                                                )}
                                            />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        page={detailPage}
                        pageSize={detailPageSize}
                        totalPages={detailTotalPages}
                        onPageChange={setDetailPage}
                    />
                </div>
            )}

            <ConfirmDialog
                confirmLabel={t('payrollProcessings.closeConfirmLabel')}
                description={t('payrollProcessings.closeDescription')}
                loading={processingAction}
                open={Boolean(processingToClose)}
                title={t('payrollProcessings.closeAction')}
                tone="primary"
                onCancel={() => setProcessingToClose(null)}
                onConfirm={() => void handleConfirmClose()}
            />
        </section>
    );
}
