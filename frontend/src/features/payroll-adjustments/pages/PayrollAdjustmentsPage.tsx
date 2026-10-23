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
    fieldClass,
    IconButton,
    LoadingOverlay,
    PageHeader,
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
        <section className="mx-auto grid w-full max-w-[1400px] gap-5 px-8 pt-8 pb-24 text-ink max-sm:px-4">
            <PageHeader
                actions={canManage && (
                    <Button
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
                description={t('payrollAdjustments.subtitle')}
                icon={<FontAwesomeIcon icon={faCoins} />}
                title={t('payrollAdjustments.title')}
            />

            {error && (
                <div className="rounded-lg border border-[#efc4b9] bg-[#f6dcd6] px-4 py-3 text-sm text-[#9a2f1f]">
                    {error}
                </div>
            )}

            <div className="relative overflow-hidden rounded-[14px] border border-rule bg-paper">
                <LoadingOverlay
                    label={t('payrollAdjustments.loading')}
                    visible={loading}
                />
                <div className="flex items-center justify-between gap-4 border-b border-rule px-5 py-4 max-lg:items-stretch max-lg:flex-col">
                    <label className="relative block w-full max-w-sm">
                        <span className="sr-only">{t('common.search')}</span>
                        <FontAwesomeIcon
                            className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-faint"
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
                    <table className="data-table w-full min-w-[1180px] table-fixed border-collapse">
                        <thead>
                            <tr>
                                <th>
                                    {t('payrollAdjustments.period')}
                                </th>
                                <th>
                                    {t('payrollAdjustments.employee')}
                                </th>
                                <th>
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
                                        key={field}
                                    >
                                        <button
                                            className="min-h-0 cursor-pointer bg-transparent p-0 text-inherit hover:text-ink"
                                            onClick={() => changeSort(field)}
                                            type="button"
                                        >
                                            {label}
                                            {sortLabel(field)}
                                        </button>
                                    </th>
                                ))}
                                <th>
                                    {t('payrollAdjustments.reason')}
                                </th>
                                <th className="cell-actions">
                                    {t('common.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading &&
                                adjustments.map((adjustment) => (
                                    <tr
                                        className="border-b border-rule-soft transition hover:bg-[#f6f4ef] last:border-0"
                                        key={adjustment.id}
                                    >
                                        <td>
                                            {adjustment.payrollPeriod.name}
                                        </td>
                                        <td>
                                            {`${adjustment.employee.employeeCode} - ${adjustment.employee.firstName} ${adjustment.employee.lastName}`}
                                        </td>
                                        <td>
                                            {adjustment.branch.name}
                                        </td>
                                        <td>
                                            <span
                                                className={`inline-flex items-center rounded-full px-[9px] py-[3px] text-xs font-semibold whitespace-nowrap ${
                                                    adjustment.category ===
                                                    RewardPenaltyCategory.Reward
                                                        ? 'bg-[#dff0e4] text-[#1f6237]'
                                                        : 'bg-[#f6dcd6] text-[#9a2f1f]'
                                                }`}
                                            >
                                                {categoryLabel(adjustment.category)}
                                            </span>
                                        </td>
                                        <td className="font-semibold text-ink">
                                            {formatAmount(adjustment.amount)}
                                        </td>
                                        <td>
                                            {formatDate(adjustment.adjustmentDate)}
                                        </td>
                                        <td className="truncate">
                                            {adjustment.reason}
                                        </td>
                                        <td className="cell-actions">
                                            <div className="flex items-center justify-end gap-1">
                                                <IconButton
                                                    icon={faEye}
                                                    label={t('common.view')}
                                                    onClick={() =>
                                                        void handleView(
                                                            adjustment.id,
                                                        )
                                                    }
                                                />
                                                {canManage && (
                                                    <>
                                                        <IconButton
                                                            icon={faPen}
                                                            label={t('common.edit')}
                                                            onClick={() => {
                                                                setEditing(adjustment);
                                                                setShowForm(true);
                                                            }}
                                                            tone="primary"
                                                        />
                                                        <IconButton
                                                            icon={faTrash}
                                                            label={t('common.delete')}
                                                            onClick={() =>
                                                                setAdjustmentToDelete(
                                                                    adjustment,
                                                                )
                                                            }
                                                            tone="danger"
                                                        />
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
