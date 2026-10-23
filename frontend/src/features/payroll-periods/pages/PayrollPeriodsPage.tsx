import { useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCalendarDays,
    faEye,
    faLock,
    faPen,
    faPlus,
    faRotateRight,
    faSearch,
    faTrash,
    faUnlock,
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
import { useI18n } from '@/i18n';
import {
    closePayrollPeriod,
    createPayrollPeriod,
    deletePayrollPeriod,
    getPayrollPeriod,
    getPayrollPeriodErrorKey,
    listPayrollPeriods,
    openPayrollPeriod,
    updatePayrollPeriod,
} from '../api/payroll-periods.api';
import { PayrollPeriodDetailsDialog } from '../components/PayrollPeriodDetailsDialog';
import { PayrollPeriodFormDialog } from '../components/PayrollPeriodFormDialog';
import {
    type PayrollPeriod,
    type PayrollPeriodPayload,
    type PayrollPeriodSortField,
    PayrollPeriodStatus,
    type PayrollPeriodStatusFilter,
    type SortOrder,
    type UpdatePayrollPeriodPayload,
} from '../types';

const pageSize = 10;
type PayrollPeriodsPageProps = {
    canManage: boolean;
};

function statusFromFilter(filter: PayrollPeriodStatusFilter) {
    if (filter === 'draft') return PayrollPeriodStatus.Draft;
    if (filter === 'open') return PayrollPeriodStatus.Open;
    if (filter === 'closed') return PayrollPeriodStatus.Closed;
    return undefined;
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
    }).format(new Date(`${value}T00:00:00`));
}

function statusTone(status: PayrollPeriodStatus) {
    if (status === PayrollPeriodStatus.Draft) {
        return 'bg-stone text-ink';
    }

    if (status === PayrollPeriodStatus.Open) {
        return 'bg-[#dff0e4] text-[#1f6237]';
    }

    return 'bg-stone-soft text-ink';
}

export function PayrollPeriodsPage({ canManage }: PayrollPeriodsPageProps) {
    const { showToast } = useToast();
    const { t } = useI18n();
    const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search);
    const [statusFilter, setStatusFilter] =
        useState<PayrollPeriodStatusFilter>('all');
    const [sortBy, setSortBy] =
        useState<PayrollPeriodSortField>('createdAt');
    const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [acting, setActing] = useState(false);
    const [error, setError] = useState('');
    const [editing, setEditing] = useState<PayrollPeriod | null>(null);
    const [selected, setSelected] = useState<PayrollPeriod | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [periodToDelete, setPeriodToDelete] =
        useState<PayrollPeriod | null>(null);
    const [periodToClose, setPeriodToClose] =
        useState<PayrollPeriod | null>(null);

    const loadPeriods = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const response = await listPayrollPeriods({
                page,
                limit: pageSize,
                search: debouncedSearch || undefined,
                status: statusFromFilter(statusFilter),
                sortBy,
                sortOrder,
            });
            setPeriods(response.data);
            setTotalPages(response.meta.totalPages);

            if (
                response.meta.totalPages > 0 &&
                page > response.meta.totalPages
            ) {
                setPage(response.meta.totalPages);
            }
        } catch (loadError) {
            setError(t(getPayrollPeriodErrorKey(loadError)));
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, page, sortBy, sortOrder, statusFilter]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadPeriods();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [loadPeriods]);

    async function handleSubmit(
        payload: PayrollPeriodPayload | UpdatePayrollPeriodPayload,
    ) {
        setSaving(true);
        try {
            if (editing) {
                await updatePayrollPeriod(editing.id, payload);
            } else {
                await createPayrollPeriod(payload as PayrollPeriodPayload);
            }

            const wasEditing = Boolean(editing);
            setShowForm(false);
            setEditing(null);
            await loadPeriods();
            showToast({
                message: wasEditing
                    ? t('payrollPeriods.updated')
                    : t('payrollPeriods.created'),
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
            setSelected(await getPayrollPeriod(id));
        } catch (viewError) {
            const message = t(getPayrollPeriodErrorKey(viewError));
            setError(message);
            showToast({
                message,
                title: t('payrollPeriods.viewError'),
                variant: 'error',
            });
        }
    }

    async function handleOpen(period: PayrollPeriod) {
        setActing(true);
        setError('');

        try {
            await openPayrollPeriod(period.id);
            await loadPeriods();
            showToast({
                message: t('payrollPeriods.opened'),
                title: t('common.success'),
                variant: 'success',
            });
        } catch (actionError) {
            const message = t(getPayrollPeriodErrorKey(actionError));
            setError(message);
            showToast({
                message,
                title: t('payrollPeriods.actionError'),
                variant: 'error',
            });
        } finally {
            setActing(false);
        }
    }

    async function handleConfirmClose() {
        if (!periodToClose) return;

        setActing(true);
        setError('');

        try {
            await closePayrollPeriod(periodToClose.id);
            setPeriodToClose(null);
            await loadPeriods();
            showToast({
                message: t('payrollPeriods.closedMessage'),
                title: t('common.success'),
                variant: 'success',
            });
        } catch (actionError) {
            const message = t(getPayrollPeriodErrorKey(actionError));
            setError(message);
            showToast({
                message,
                title: t('payrollPeriods.actionError'),
                variant: 'error',
            });
        } finally {
            setActing(false);
        }
    }

    async function handleConfirmDelete() {
        if (!periodToDelete) return;

        setActing(true);
        setError('');

        try {
            await deletePayrollPeriod(periodToDelete.id);
            if (selected?.id === periodToDelete.id) setSelected(null);
            const deletedName = periodToDelete.name;
            setPeriodToDelete(null);
            await loadPeriods();
            showToast({
                message: t('payrollPeriods.deleted').replace(
                    '{name}',
                    deletedName,
                ),
                title: t('common.success'),
                variant: 'success',
            });
        } catch (deleteError) {
            const message = t(getPayrollPeriodErrorKey(deleteError));
            setError(message);
            showToast({
                message,
                title: t('payrollPeriods.deleteError'),
                variant: 'error',
            });
        } finally {
            setActing(false);
        }
    }

    function changeSort(field: PayrollPeriodSortField) {
        if (sortBy === field) {
            setSortOrder((current) => (current === 'ASC' ? 'DESC' : 'ASC'));
        } else {
            setSortBy(field);
            setSortOrder('ASC');
        }
        setPage(1);
    }

    function sortLabel(field: PayrollPeriodSortField) {
        if (sortBy !== field) return '';
        return sortOrder === 'ASC' ? ' ^' : ' v';
    }

    function statusLabel(status: PayrollPeriodStatus) {
        if (status === PayrollPeriodStatus.Draft) return t('payrollPeriods.draft');
        if (status === PayrollPeriodStatus.Open) return t('payrollPeriods.open');
        return t('payrollPeriods.closed');
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
                        {t('payrollPeriods.add')}
                    </Button>
                )}
                description={t('payrollPeriods.subtitle')}
                icon={<FontAwesomeIcon icon={faCalendarDays} />}
                title={t('payrollPeriods.title')}
            />

            {error && (
                <div className="rounded-lg border border-[#efc4b9] bg-[#f6dcd6] px-4 py-3 text-sm text-[#9a2f1f]">
                    {error}
                </div>
            )}

            <div className="relative overflow-hidden rounded-[14px] border border-rule bg-paper">
                <LoadingOverlay
                    label={t('payrollPeriods.loading')}
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
                            placeholder={t('payrollPeriods.searchPlaceholder')}
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
                                { value: 'draft', label: t('payrollPeriods.draft') },
                                { value: 'open', label: t('payrollPeriods.open') },
                                {
                                    value: 'closed',
                                    label: t('payrollPeriods.closed'),
                                },
                            ]}
                            value={statusFilter}
                            onChange={(value) => {
                                setStatusFilter(value as PayrollPeriodStatusFilter);
                                setPage(1);
                            }}
                        />
                        <Button
                            className="max-sm:w-full"
                            onClick={() => void loadPeriods()}
                            size="lg"
                            variant="secondary"
                        >
                            <FontAwesomeIcon icon={faRotateRight} />
                            {t('common.refresh')}
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="data-table w-full min-w-[1120px] table-fixed border-collapse">
                        <thead>
                            <tr>
                                {(
                                    [
                                        ['code', t('payrollPeriods.code')],
                                        ['name', t('payrollPeriods.name')],
                                        ['payrollMonth', t('payrollPeriods.month')],
                                        ['payrollYear', t('payrollPeriods.year')],
                                        ['startDate', t('payrollPeriods.startDate')],
                                        ['endDate', t('payrollPeriods.endDate')],
                                        ['status', t('common.status')],
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
                                <th className="cell-actions">
                                    {t('common.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading &&
                                periods.map((period) => (
                                    <tr
                                        className="border-b border-rule-soft transition hover:bg-[#f6f4ef] last:border-0"
                                        key={period.id}
                                    >
                                        <td className="font-semibold text-ink">
                                            {period.code}
                                        </td>
                                        <td>
                                            {period.name}
                                        </td>
                                        <td>
                                            {period.payrollMonth}
                                        </td>
                                        <td>
                                            {period.payrollYear}
                                        </td>
                                        <td>
                                            {formatDate(period.startDate)}
                                        </td>
                                        <td>
                                            {formatDate(period.endDate)}
                                        </td>
                                        <td>
                                            <span
                                                className={`inline-flex items-center rounded-full px-[9px] py-[3px] text-xs font-semibold whitespace-nowrap ${statusTone(period.status)}`}
                                            >
                                                {statusLabel(period.status)}
                                            </span>
                                        </td>
                                        <td className="cell-actions">
                                            <div className="flex items-center justify-end gap-1">
                                                <IconButton
                                                    icon={faEye}
                                                    label={t('common.view')}
                                                    onClick={() =>
                                                        void handleView(period.id)
                                                    }
                                                />
                                                {canManage && (
                                                    <>
                                                        <IconButton
                                                            disabled={
                                                                period.status !==
                                                                PayrollPeriodStatus.Draft
                                                            }
                                                            icon={faPen}
                                                            label={t(
                                                                'common.edit',
                                                            )}
                                                            onClick={() => {
                                                                setEditing(period);
                                                                setShowForm(true);
                                                            }}
                                                            tone="primary"
                                                        />
                                                        {period.status ===
                                                            PayrollPeriodStatus.Draft && (
                                                            <IconButton
                                                                disabled={acting}
                                                                icon={faUnlock}
                                                                label={t(
                                                                    'payrollPeriods.openAction',
                                                                )}
                                                                onClick={() =>
                                                                    void handleOpen(
                                                                        period,
                                                                    )
                                                                }
                                                                tone="success"
                                                            />
                                                        )}
                                                        {period.status ===
                                                            PayrollPeriodStatus.Open && (
                                                            <IconButton
                                                                disabled={acting}
                                                                icon={faLock}
                                                                label={t(
                                                                    'payrollPeriods.closeAction',
                                                                )}
                                                                onClick={() =>
                                                                    setPeriodToClose(
                                                                        period,
                                                                    )
                                                                }
                                                            />
                                                        )}
                                                        <IconButton
                                                            disabled={
                                                                period.status !==
                                                                PayrollPeriodStatus.Draft
                                                            }
                                                            icon={faTrash}
                                                            label={t(
                                                                'common.delete',
                                                            )}
                                                            onClick={() =>
                                                                setPeriodToDelete(
                                                                    period,
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
                            {!loading && periods.length === 0 && (
                                <tr>
                                    <td colSpan={8}>
                                        <EmptyState
                                            description={t(
                                                'payrollPeriods.noResultsDescription',
                                            )}
                                            icon={
                                                <FontAwesomeIcon
                                                    icon={faCalendarDays}
                                                />
                                            }
                                            title={t(
                                                'payrollPeriods.noResultsTitle',
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
                <PayrollPeriodFormDialog
                    editing={editing}
                    saving={saving}
                    onClose={() => setShowForm(false)}
                    onSubmit={handleSubmit}
                />
            )}

            {selected && (
                <PayrollPeriodDetailsDialog
                    period={selected}
                    onClose={() => setSelected(null)}
                />
            )}

            <ConfirmDialog
                confirmLabel={t('payrollPeriods.deleteConfirmLabel')}
                description={t('payrollPeriods.deleteDescription').replace(
                    '{name}',
                    periodToDelete?.name ?? '',
                )}
                loading={acting}
                open={Boolean(periodToDelete)}
                title={t('common.confirmDelete')}
                tone="danger"
                onCancel={() => setPeriodToDelete(null)}
                onConfirm={() => void handleConfirmDelete()}
            />

            <ConfirmDialog
                confirmLabel={t('payrollPeriods.closeConfirmLabel')}
                description={t('payrollPeriods.closeDescription')}
                loading={acting}
                open={Boolean(periodToClose)}
                title={t('payrollPeriods.closeAction')}
                tone="primary"
                onCancel={() => setPeriodToClose(null)}
                onConfirm={() => void handleConfirmClose()}
            />
        </section>
    );
}
