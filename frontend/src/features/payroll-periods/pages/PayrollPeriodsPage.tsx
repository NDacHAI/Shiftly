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
    LoadingOverlay,
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
const fieldClass =
    'min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100';

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
        return 'bg-slate-100 text-slate-700';
    }

    if (status === PayrollPeriodStatus.Open) {
        return 'bg-emerald-50 text-emerald-700';
    }

    return 'bg-violet-50 text-violet-700';
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
        <section className="mx-auto grid max-w-[1440px] gap-5 p-6 max-sm:p-4">
            <div className="flex items-center justify-between gap-5 rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm max-sm:items-stretch max-sm:flex-col">
                <div className="flex items-center gap-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xl text-primary-600">
                        <FontAwesomeIcon icon={faCalendarDays} />
                    </span>
                    <div>
                        <h2 className="text-xl font-bold text-slate-950">
                            {t('payrollPeriods.title')}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {t('payrollPeriods.subtitle')}
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
                        {t('payrollPeriods.add')}
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
                    label={t('payrollPeriods.loading')}
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
                    <table className="w-full min-w-[1120px] table-fixed border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
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
                                    {t('common.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading &&
                                periods.map((period) => (
                                    <tr
                                        className="border-b border-slate-100 transition hover:bg-slate-50/80 last:border-0"
                                        key={period.id}
                                    >
                                        <td className="px-5 py-3.5 text-center text-sm font-semibold text-slate-800">
                                            {period.code}
                                        </td>
                                        <td className="px-5 py-3.5 text-center text-sm text-slate-700">
                                            {period.name}
                                        </td>
                                        <td className="px-5 py-3.5 text-center text-sm text-slate-700">
                                            {period.payrollMonth}
                                        </td>
                                        <td className="px-5 py-3.5 text-center text-sm text-slate-700">
                                            {period.payrollYear}
                                        </td>
                                        <td className="px-5 py-3.5 text-center text-sm text-slate-700">
                                            {formatDate(period.startDate)}
                                        </td>
                                        <td className="px-5 py-3.5 text-center text-sm text-slate-700">
                                            {formatDate(period.endDate)}
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(period.status)}`}
                                            >
                                                {statusLabel(period.status)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    aria-label={t('common.view')}
                                                    className="flex size-9 min-h-0 cursor-pointer items-center justify-center rounded-lg border border-primary-100 bg-primary-50 p-0 text-primary-600 transition hover:border-primary-300 hover:bg-primary-600 hover:text-white"
                                                    title={t('common.view')}
                                                    type="button"
                                                    onClick={() =>
                                                        void handleView(period.id)
                                                    }
                                                >
                                                    <FontAwesomeIcon icon={faEye} />
                                                </button>
                                                {canManage && (
                                                    <>
                                                        <button
                                                            aria-label={t(
                                                                'common.edit',
                                                            )}
                                                            className="flex size-9 min-h-0 cursor-pointer items-center justify-center rounded-lg border border-blue-100 bg-blue-50 p-0 text-blue-600 transition hover:border-blue-300 hover:bg-blue-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                                            disabled={
                                                                period.status !==
                                                                PayrollPeriodStatus.Draft
                                                            }
                                                            title={t('common.edit')}
                                                            type="button"
                                                            onClick={() => {
                                                                setEditing(period);
                                                                setShowForm(true);
                                                            }}
                                                        >
                                                            <FontAwesomeIcon
                                                                icon={faPen}
                                                            />
                                                        </button>
                                                        {period.status ===
                                                            PayrollPeriodStatus.Draft && (
                                                            <button
                                                                aria-label={t(
                                                                    'payrollPeriods.openAction',
                                                                )}
                                                                className="flex size-9 min-h-0 cursor-pointer items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 p-0 text-emerald-600 transition hover:border-emerald-300 hover:bg-emerald-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                                                disabled={acting}
                                                                title={t(
                                                                    'payrollPeriods.openAction',
                                                                )}
                                                                type="button"
                                                                onClick={() =>
                                                                    void handleOpen(
                                                                        period,
                                                                    )
                                                                }
                                                            >
                                                                <FontAwesomeIcon
                                                                    icon={faUnlock}
                                                                />
                                                            </button>
                                                        )}
                                                        {period.status ===
                                                            PayrollPeriodStatus.Open && (
                                                            <button
                                                                aria-label={t(
                                                                    'payrollPeriods.closeAction',
                                                                )}
                                                                className="flex size-9 min-h-0 cursor-pointer items-center justify-center rounded-lg border border-violet-100 bg-violet-50 p-0 text-violet-600 transition hover:border-violet-300 hover:bg-violet-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                                                disabled={acting}
                                                                title={t(
                                                                    'payrollPeriods.closeAction',
                                                                )}
                                                                type="button"
                                                                onClick={() =>
                                                                    setPeriodToClose(
                                                                        period,
                                                                    )
                                                                }
                                                            >
                                                                <FontAwesomeIcon
                                                                    icon={faLock}
                                                                />
                                                            </button>
                                                        )}
                                                        <button
                                                            aria-label={t(
                                                                'common.delete',
                                                            )}
                                                            className="flex size-9 min-h-0 cursor-pointer items-center justify-center rounded-lg border border-red-100 bg-red-50 p-0 text-red-600 transition hover:border-red-300 hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                                            disabled={
                                                                period.status !==
                                                                PayrollPeriodStatus.Draft
                                                            }
                                                            title={t('common.delete')}
                                                            type="button"
                                                            onClick={() =>
                                                                setPeriodToDelete(
                                                                    period,
                                                                )
                                                            }
                                                        >
                                                            <FontAwesomeIcon
                                                                icon={faTrash}
                                                            />
                                                        </button>
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
