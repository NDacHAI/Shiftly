import { useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCoins,
    faEye,
    faPen,
    faPlus,
    faRotateRight,
    faSearch,
    faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { ConfirmDialog, useToast } from '@/components/feedback';
import {
    Button,
    DropdownSelect,
    EmptyState,
    LoadingOverlay,
    Pagination,
} from '@/components/ui';
import { useDebounce } from '@/hooks/useDebounce';
import { listEmployees } from '@/features/employees/api/employees.api';
import { type Employee } from '@/features/employees/types';
import { listPayrollPeriods } from '@/features/payroll-periods/api/payroll-periods.api';
import {
    type PayrollPeriod,
    PayrollPeriodStatus,
} from '@/features/payroll-periods/types';
import { listRewardPenaltyCatalogs } from '@/features/reward-penalty-catalogs/api/reward-penalty-catalogs.api';
import {
    type RewardPenaltyCatalog,
    RewardPenaltyStatus,
} from '@/features/reward-penalty-catalogs/types';
import { useI18n } from '@/i18n';
import {
    createPayrollAdjustment,
    deletePayrollAdjustment,
    getPayrollAdjustment,
    getPayrollAdjustmentErrorKey,
    listPayrollAdjustments,
    updatePayrollAdjustment,
} from '../api/payroll-adjustments.api';
import { PayrollAdjustmentDetailsDialog } from '../components/PayrollAdjustmentDetailsDialog';
import { PayrollAdjustmentFormDialog } from '../components/PayrollAdjustmentFormDialog';
import {
    type PayrollAdjustment,
    type PayrollAdjustmentCategoryFilter,
    type PayrollAdjustmentPayload,
    type PayrollAdjustmentSortField,
    RewardPenaltyCategory,
    type SortOrder,
    type UpdatePayrollAdjustmentPayload,
} from '../types';

const pageSize = 10;
const fieldClass =
    'min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100';

type PayrollAdjustmentsPageProps = {
    canManage: boolean;
};

function categoryFromFilter(filter: PayrollAdjustmentCategoryFilter) {
    if (filter === 'reward') return RewardPenaltyCategory.Reward;
    if (filter === 'penalty') return RewardPenaltyCategory.Penalty;
    return undefined;
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
    }).format(new Date(`${value}T00:00:00`));
}

function formatAmount(value: string) {
    return new Intl.NumberFormat('vi-VN').format(Number(value));
}

export function PayrollAdjustmentsPage({
    canManage,
}: PayrollAdjustmentsPageProps) {
    const { showToast } = useToast();
    const { t } = useI18n();
    const [adjustments, setAdjustments] = useState<PayrollAdjustment[]>([]);
    const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [catalogs, setCatalogs] = useState<RewardPenaltyCatalog[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search);
    const [periodFilter, setPeriodFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] =
        useState<PayrollAdjustmentCategoryFilter>('all');
    const [sortBy, setSortBy] =
        useState<PayrollAdjustmentSortField>('createdAt');
    const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');
    const [editing, setEditing] = useState<PayrollAdjustment | null>(null);
    const [selected, setSelected] = useState<PayrollAdjustment | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [adjustmentToDelete, setAdjustmentToDelete] =
        useState<PayrollAdjustment | null>(null);

    const loadAdjustments = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const response = await listPayrollAdjustments({
                page,
                limit: pageSize,
                search: debouncedSearch || undefined,
                payrollPeriodId:
                    periodFilter === 'all' ? undefined : periodFilter,
                category: categoryFromFilter(categoryFilter),
                sortBy,
                sortOrder,
            });
            setAdjustments(response.data);
            setTotalPages(response.meta.totalPages);

            if (
                response.meta.totalPages > 0 &&
                page > response.meta.totalPages
            ) {
                setPage(response.meta.totalPages);
            }
        } catch (loadError) {
            setError(t(getPayrollAdjustmentErrorKey(loadError)));
        } finally {
            setLoading(false);
        }
    }, [categoryFilter, debouncedSearch, page, periodFilter, sortBy, sortOrder]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadAdjustments();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [loadAdjustments]);

    useEffect(() => {
        async function loadOptions() {
            try {
                const [periodResponse, employeeResponse, catalogResponse] =
                    await Promise.all([
                        listPayrollPeriods({
                            page: 1,
                            limit: 100,
                            status: PayrollPeriodStatus.Open,
                            sortBy: 'createdAt',
                            sortOrder: 'DESC',
                        }),
                        listEmployees({
                            page: 1,
                            limit: 100,
                            sortBy: 'employeeCode',
                            sortOrder: 'ASC',
                        }),
                        listRewardPenaltyCatalogs({
                            page: 1,
                            limit: 100,
                            status: RewardPenaltyStatus.Active,
                            sortBy: 'name',
                            sortOrder: 'ASC',
                        }),
                    ]);

                setPeriods(periodResponse.data);
                setEmployees(employeeResponse.data);
                setCatalogs(catalogResponse.data);
            } catch (optionError) {
                setError(t(getPayrollAdjustmentErrorKey(optionError)));
            }
        }

        void loadOptions();
    }, []);

    async function handleSubmit(
        payload: PayrollAdjustmentPayload | UpdatePayrollAdjustmentPayload,
    ) {
        setSaving(true);
        try {
            if (editing) {
                await updatePayrollAdjustment(editing.id, payload);
            } else {
                await createPayrollAdjustment(
                    payload as PayrollAdjustmentPayload,
                );
            }

            const wasEditing = Boolean(editing);
            setShowForm(false);
            setEditing(null);
            await loadAdjustments();
            showToast({
                message: wasEditing
                    ? t('payrollAdjustments.updated')
                    : t('payrollAdjustments.created'),
                title: t('common.success'),
                variant: 'success',
            });
        } finally {
            setSaving(false);
        }
    }

    async function handleView(id: string) {
        setError('');

        try {
            setSelected(await getPayrollAdjustment(id));
        } catch (viewError) {
            const message = t(getPayrollAdjustmentErrorKey(viewError));
            setError(message);
            showToast({
                message,
                title: t('payrollAdjustments.viewError'),
                variant: 'error',
            });
        }
    }

    async function handleConfirmDelete() {
        if (!adjustmentToDelete) return;

        setDeleting(true);
        setError('');

        try {
            await deletePayrollAdjustment(adjustmentToDelete.id);
            if (selected?.id === adjustmentToDelete.id) setSelected(null);
            setAdjustmentToDelete(null);
            await loadAdjustments();
            showToast({
                message: t('payrollAdjustments.deleted'),
                title: t('common.success'),
                variant: 'success',
            });
        } catch (deleteError) {
            const message = t(getPayrollAdjustmentErrorKey(deleteError));
            setError(message);
            showToast({
                message,
                title: t('payrollAdjustments.deleteError'),
                variant: 'error',
            });
        } finally {
            setDeleting(false);
        }
    }

    function changeSort(field: PayrollAdjustmentSortField) {
        if (sortBy === field) {
            setSortOrder((current) => (current === 'ASC' ? 'DESC' : 'ASC'));
        } else {
            setSortBy(field);
            setSortOrder('ASC');
        }
        setPage(1);
    }

    function sortLabel(field: PayrollAdjustmentSortField) {
        if (sortBy !== field) return '';
        return sortOrder === 'ASC' ? ' ^' : ' v';
    }

    function categoryLabel(category: RewardPenaltyCategory) {
        return category === RewardPenaltyCategory.Reward
            ? t('payrollAdjustments.reward')
            : t('payrollAdjustments.penalty');
    }

    return (
        <section className="mx-auto grid max-w-[1440px] gap-5 p-6 max-sm:p-4">
            <div className="flex items-center justify-between gap-5 rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm max-sm:items-stretch max-sm:flex-col">
                <div className="flex items-center gap-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xl text-primary-600">
                        <FontAwesomeIcon icon={faCoins} />
                    </span>
                    <div>
                        <h2 className="text-xl font-bold text-slate-950">
                            {t('payrollAdjustments.title')}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {t('payrollAdjustments.subtitle')}
                        </p>
                    </div>
                </div>
                {canManage && (
                    <Button
                        className="shadow-sm"
                        onClick={() => {
                            setEditing(null);
                            setShowForm(true);
                        }}
                        size="lg"
                    >
                        <FontAwesomeIcon icon={faPlus} />
                        {t('payrollAdjustments.add')}
                    </Button>
                )}
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <LoadingOverlay
                    label={t('payrollAdjustments.loading')}
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
                            placeholder={t('payrollAdjustments.searchPlaceholder')}
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                        />
                    </label>

                    <div className="flex items-center gap-3 max-sm:flex-col">
                        <DropdownSelect
                            ariaLabel={t('payrollAdjustments.period')}
                            className="max-sm:w-full"
                            options={[
                                { value: 'all', label: t('payrollAdjustments.allPeriods') },
                                ...periods.map((period) => ({
                                    value: period.id,
                                    label: period.name,
                                })),
                            ]}
                            value={periodFilter}
                            onChange={(value) => {
                                setPeriodFilter(value);
                                setPage(1);
                            }}
                        />
                        <DropdownSelect
                            ariaLabel={t('payrollAdjustments.category')}
                            className="max-sm:w-full"
                            options={[
                                { value: 'all', label: t('payrollAdjustments.allCategories') },
                                { value: 'reward', label: t('payrollAdjustments.reward') },
                                { value: 'penalty', label: t('payrollAdjustments.penalty') },
                            ]}
                            value={categoryFilter}
                            onChange={(value) => {
                                setCategoryFilter(
                                    value as PayrollAdjustmentCategoryFilter,
                                );
                                setPage(1);
                            }}
                        />
                        <Button
                            className="max-sm:w-full"
                            onClick={() => void loadAdjustments()}
                            size="lg"
                            variant="secondary"
                        >
                            <FontAwesomeIcon icon={faRotateRight} />
                            {t('common.refresh')}
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1180px] table-fixed border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-600">
                                    {t('payrollAdjustments.period')}
                                </th>
                                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-600">
                                    {t('payrollAdjustments.employee')}
                                </th>
                                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-600">
                                    {t('payrollAdjustments.branch')}
                                </th>
                                {(
                                    [
                                        ['category', t('payrollAdjustments.category')],
                                        ['amount', t('payrollAdjustments.amount')],
                                        ['adjustmentDate', t('payrollAdjustments.adjustmentDate')],
                                    ] as const
                                ).map(([field, label]) => (
                                    <th
                                        className="px-5 py-3 text-center text-xs font-semibold text-slate-600"
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
                                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-600">
                                    {t('payrollAdjustments.reason')}
                                </th>
                                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-600">
                                    {t('common.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading &&
                                adjustments.map((adjustment) => (
                                    <tr
                                        className="border-b border-slate-100 transition hover:bg-slate-50/80 last:border-0"
                                        key={adjustment.id}
                                    >
                                        <td className="px-5 py-3.5 text-center text-sm text-slate-700">
                                            {adjustment.payrollPeriod.name}
                                        </td>
                                        <td className="px-5 py-3.5 text-center text-sm text-slate-700">
                                            {`${adjustment.employee.employeeCode} - ${adjustment.employee.firstName} ${adjustment.employee.lastName}`}
                                        </td>
                                        <td className="px-5 py-3.5 text-center text-sm text-slate-700">
                                            {adjustment.branch.name}
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                    adjustment.category ===
                                                    RewardPenaltyCategory.Reward
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-red-50 text-red-700'
                                                }`}
                                            >
                                                {categoryLabel(adjustment.category)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-center text-sm font-semibold text-slate-800">
                                            {formatAmount(adjustment.amount)}
                                        </td>
                                        <td className="px-5 py-3.5 text-center text-sm text-slate-700">
                                            {formatDate(adjustment.adjustmentDate)}
                                        </td>
                                        <td className="truncate px-5 py-3.5 text-center text-sm text-slate-700">
                                            {adjustment.reason}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    aria-label={t('common.view')}
                                                    className="flex size-9 min-h-0 cursor-pointer items-center justify-center rounded-lg border border-primary-100 bg-primary-50 p-0 text-primary-600 transition hover:border-primary-300 hover:bg-primary-600 hover:text-white"
                                                    title={t('common.view')}
                                                    type="button"
                                                    onClick={() =>
                                                        void handleView(
                                                            adjustment.id,
                                                        )
                                                    }
                                                >
                                                    <FontAwesomeIcon icon={faEye} />
                                                </button>
                                                {canManage && (
                                                    <>
                                                        <button
                                                            aria-label={t('common.edit')}
                                                            className="flex size-9 min-h-0 cursor-pointer items-center justify-center rounded-lg border border-blue-100 bg-blue-50 p-0 text-blue-600 transition hover:border-blue-300 hover:bg-blue-600 hover:text-white"
                                                            title={t('common.edit')}
                                                            type="button"
                                                            onClick={() => {
                                                                setEditing(adjustment);
                                                                setShowForm(true);
                                                            }}
                                                        >
                                                            <FontAwesomeIcon icon={faPen} />
                                                        </button>
                                                        <button
                                                            aria-label={t('common.delete')}
                                                            className="flex size-9 min-h-0 cursor-pointer items-center justify-center rounded-lg border border-red-100 bg-red-50 p-0 text-red-600 transition hover:border-red-300 hover:bg-red-600 hover:text-white"
                                                            title={t('common.delete')}
                                                            type="button"
                                                            onClick={() =>
                                                                setAdjustmentToDelete(
                                                                    adjustment,
                                                                )
                                                            }
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            {!loading && adjustments.length === 0 && (
                                <tr>
                                    <td colSpan={8}>
                                        <EmptyState
                                            description={t(
                                                'payrollAdjustments.noResultsDescription',
                                            )}
                                            icon={<FontAwesomeIcon icon={faCoins} />}
                                            title={t(
                                                'payrollAdjustments.noResultsTitle',
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

            {showForm && (
                <PayrollAdjustmentFormDialog
                    catalogs={catalogs}
                    editing={editing}
                    employees={employees}
                    periods={periods}
                    saving={saving}
                    onClose={() => setShowForm(false)}
                    onSubmit={handleSubmit}
                />
            )}

            {selected && (
                <PayrollAdjustmentDetailsDialog
                    adjustment={selected}
                    onClose={() => setSelected(null)}
                />
            )}

            <ConfirmDialog
                confirmLabel={t('payrollAdjustments.deleteConfirmLabel')}
                description={t('payrollAdjustments.deleteDescription')}
                loading={deleting}
                open={Boolean(adjustmentToDelete)}
                title={t('common.confirmDelete')}
                tone="danger"
                onCancel={() => setAdjustmentToDelete(null)}
                onConfirm={() => void handleConfirmDelete()}
            />
        </section>
    );
}
