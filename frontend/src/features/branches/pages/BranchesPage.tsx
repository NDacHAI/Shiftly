import { useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBuilding,
    faEye,
    faFilter,
    faPause,
    faPen,
    faPlus,
    faRotateRight,
    faSearch,
    faTrash,
    faUsers,
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
    createBranch,
    deleteBranch,
    getBranch,
    getBranchErrorMessage,
    listBranches,
    updateBranch,
} from '../api/branches.api';
import { BranchDetailsDialog } from '../components/BranchDetailsDialog';
import { BranchFormDialog } from '../components/BranchFormDialog';
import {
    type Branch,
    type BranchPayload,
    type BranchSortField,
    type SortOrder,
} from '../types';

const pageSize = 10;
type StatusFilter = 'all' | 'active' | 'inactive';

const fieldClass =
    'min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500';

function formatDate(value: string) {
    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(value));
}

export function BranchesPage() {
    const { showToast } = useToast();
    const { t } = useI18n();
    const [branches, setBranches] = useState<Branch[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const debouncedSearch = useDebounce(search);
    const [sortBy, setSortBy] = useState<BranchSortField>('createdAt');
    const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editing, setEditing] = useState<Branch | null>(null);
    const [selected, setSelected] = useState<Branch | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [branchToDelete, setBranchToDelete] =
        useState<Branch | null>(null);
    const [deleting, setDeleting] = useState(false);

    const loadBranches = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const response = await listBranches({
                page,
                limit: pageSize,
                search: debouncedSearch || undefined,
                sortBy,
                sortOrder,
            });
            setBranches(response.data);
            setTotal(response.meta.total);
            setTotalPages(response.meta.totalPages);

            if (
                response.meta.totalPages > 0 &&
                page > response.meta.totalPages
            ) {
                setPage(response.meta.totalPages);
            }
        } catch (loadError) {
            setError(getBranchErrorMessage(loadError));
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, page, sortBy, sortOrder]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadBranches();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [loadBranches]);

    const activeCount = branches.filter(
        (branch) => branch.status,
    ).length;
    const inactiveCount = branches.length - activeCount;
    const displayedBranches = branches.filter((branch) => {
        if (statusFilter === 'active') return branch.status;
        if (statusFilter === 'inactive') return !branch.status;
        return true;
    });

    async function handleSubmit(form: BranchPayload) {
        if (editing) {
            await updateBranch(editing.id, form);
        } else {
            await createBranch(form);
        }

        const wasEditing = Boolean(editing);
        setShowForm(false);
        setEditing(null);
        await loadBranches();
        showToast({
            message: wasEditing
                ? t('branches.updated')
                : t('branches.created'),
            title: t('common.success'),
            variant: 'success',
        });
    }

    async function handleView(id: string) {
        setError('');

        try {
            setSelected(await getBranch(id));
        } catch (viewError) {
            const message = getBranchErrorMessage(viewError);
            setError(message);
            showToast({
                message,
                title: t('branches.viewError'),
                variant: 'error',
            });
        }
    }

    async function handleConfirmDelete() {
        if (!branchToDelete) return;

        setDeleting(true);
        setError('');

        try {
            await deleteBranch(branchToDelete.id);
            if (selected?.id === branchToDelete.id) setSelected(null);
            const deletedBranchName = branchToDelete.name;
            setBranchToDelete(null);
            await loadBranches();
            showToast({
                message: t('branches.deleted').replace(
                    '{name}',
                    deletedBranchName,
                ),
                title: t('common.success'),
                variant: 'success',
            });
        } catch (deleteError) {
            const message = getBranchErrorMessage(deleteError);
            setError(message);
            showToast({
                message,
                title: t('branches.deleteError'),
                variant: 'error',
            });
        } finally {
            setDeleting(false);
        }
    }

    function changeSort(field: BranchSortField) {
        if (sortBy === field) {
            setSortOrder((current) => (current === 'ASC' ? 'DESC' : 'ASC'));
        } else {
            setSortBy(field);
            setSortOrder('ASC');
        }
        setPage(1);
    }

    function sortLabel(field: BranchSortField) {
        if (sortBy !== field) return '';
        return sortOrder === 'ASC' ? ' ^' : ' v';
    }

    const stats = [
        {
            label: t('branches.total'),
            value: total,
            note: t('branches.totalNote'),
            icon: faUsers,
            color: 'bg-primary-50 text-primary-600',
        },
        {
            label: t('branches.activeOnPage'),
            value: activeCount,
            note: t('branches.activeOnPage'),
            icon: faPlus,
            color: 'bg-emerald-50 text-emerald-600',
        },
        {
            label: t('branches.inactiveOnPage'),
            value: inactiveCount,
            note: t('branches.inactiveOnPage'),
            icon: faPause,
            color: 'bg-amber-50 text-amber-500',
        },
        {
            label: t('branches.employeeTotal'),
            value: 0,
            note: t('branches.employeeTotalNote'),
            icon: faBuilding,
            color: 'bg-sky-50 text-sky-600',
        },
    ];

    return (
        <section className="mx-auto grid max-w-[1440px] gap-5 p-6 max-sm:p-4">
            <div className="flex items-center justify-between gap-5 rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm max-sm:items-stretch max-sm:flex-col">
                <div className="flex items-center gap-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xl text-primary-600">
                        <FontAwesomeIcon icon={faBuilding} />
                    </span>
                    <div>
                        <h2 className="text-xl font-bold text-slate-950">
                            {t('branches.title')}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {t('branches.subtitle')}
                        </p>
                    </div>
                </div>
                <Button
                    className="shadow-sm"
                    onClick={() => {
                        setEditing(null);
                        setShowForm(true);
                    }}
                    size="lg"
                >
                    <FontAwesomeIcon icon={faPlus} />
                    {t('branches.add')}
                </Button>
            </div>

            <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1">
                {stats.map((stat) => (
                    <article
                        className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                        key={stat.label}
                    >
                        <span
                            className={`flex size-12 shrink-0 items-center justify-center rounded-full text-lg ${stat.color}`}
                        >
                            <FontAwesomeIcon icon={stat.icon} />
                        </span>
                        <div>
                            <p className="text-sm text-slate-500">{stat.label}</p>
                            <strong className="mt-1 block text-2xl text-slate-950">
                                {stat.value}
                            </strong>
                            <p className="mt-1 text-xs text-slate-400">
                                {stat.note}
                            </p>
                        </div>
                    </article>
                ))}
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <LoadingOverlay label={t('branches.loading')} visible={loading} />
                <div className="flex items-center justify-between gap-4 border-b border-slate-200 p-4 max-md:items-stretch max-md:flex-col">
                    <label className="relative block w-full max-w-sm">
                        <span className="sr-only">{t('common.search')}</span>
                        <FontAwesomeIcon
                            className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400"
                            icon={faSearch}
                        />
                        <input
                            aria-label={t('common.search')}
                            className={`${fieldClass} pl-9`}
                            placeholder={t('branches.searchPlaceholder')}
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                        />
                    </label>

                    <div className="flex items-center gap-3 max-sm:flex-col">
                        <label className="relative">
                            <span className="sr-only">{t('common.status')}</span>
                            <FontAwesomeIcon
                                className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-500"
                                icon={faFilter}
                            />
                            <DropdownSelect
                                ariaLabel={t('common.status')}
                                className="max-sm:w-full"
                                options={[
                                    {
                                        value: 'all',
                                        label: t('common.allStatuses'),
                                    },
                                    {
                                        value: 'active',
                                        label: t('common.active'),
                                    },
                                    {
                                        value: 'inactive',
                                        label: t('common.inactive'),
                                    },
                                ]}
                                value={statusFilter}
                                onChange={(value) =>
                                    setStatusFilter(value as StatusFilter)
                                }
                            />
                        </label>
                        <Button
                            className="max-sm:w-full"
                            onClick={() => void loadBranches()}
                            size="lg"
                            variant="secondary"
                        >
                            <FontAwesomeIcon icon={faRotateRight} />
                            {t('common.refresh')}
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[820px] table-fixed border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                {(
                                    [
                                        ['code', t('common.code')],
                                        ['name', t('common.name')],
                                        ['status', t('common.status')],
                                        ['createdAt', t('common.createdAt')],
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
                                displayedBranches.map((branch) => (
                                    <tr
                                        className="border-b border-slate-100 transition hover:bg-slate-50/80 last:border-0"
                                        key={branch.id}
                                    >
                                        <td className="px-5 py-3.5 text-center text-sm font-semibold text-slate-800">
                                            {branch.code}
                                        </td>
                                        <td className="px-5 py-3.5 text-center text-sm text-slate-700">
                                            {branch.name}
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                    branch.status
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-amber-50 text-amber-700'
                                                }`}
                                            >
                                                <span
                                                    className={`size-1.5 rounded-full ${
                                                        branch.status
                                                            ? 'bg-emerald-500'
                                                            : 'bg-amber-500'
                                                    }`}
                                                />
                                                {branch.status
                                                    ? t('common.active')
                                                    : t('common.inactive')}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-center text-sm text-slate-600">
                                            {formatDate(branch.createdAt)}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    aria-label={t('common.view')}
                                                    className="flex size-9 min-h-0 cursor-pointer items-center justify-center rounded-lg border border-primary-100 bg-primary-50 p-0 text-primary-600 transition hover:border-primary-300 hover:bg-primary-600 hover:text-white"
                                                    onClick={() =>
                                                        void handleView(branch.id)
                                                    }
                                                    title={t('common.view')}
                                                    type="button"
                                                >
                                                    <FontAwesomeIcon icon={faEye} />
                                                </button>
                                                <button
                                                    aria-label={t('common.edit')}
                                                    className="flex size-9 min-h-0 cursor-pointer items-center justify-center rounded-lg border border-blue-100 bg-blue-50 p-0 text-blue-600 transition hover:border-blue-300 hover:bg-blue-600 hover:text-white"
                                                    onClick={() => {
                                                        setEditing(branch);
                                                        setShowForm(true);
                                                    }}
                                                    title={t('common.edit')}
                                                    type="button"
                                                >
                                                    <FontAwesomeIcon icon={faPen} />
                                                </button>
                                                <button
                                                    aria-label={t('common.delete')}
                                                    className="flex size-9 min-h-0 cursor-pointer items-center justify-center rounded-lg border border-red-100 bg-red-50 p-0 text-red-600 transition hover:border-red-300 hover:bg-red-600 hover:text-white"
                                                    onClick={() =>
                                                        setBranchToDelete(
                                                            branch,
                                                        )
                                                    }
                                                    title={t('common.delete')}
                                                    type="button"
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            {!loading && displayedBranches.length === 0 && (
                                <tr>
                                    <td colSpan={5}>
                                        <EmptyState
                                            description={t(
                                                'branches.noResultsDescription',
                                            )}
                                            icon={<FontAwesomeIcon icon={faBuilding} />}
                                            title={t('branches.noResultsTitle')}
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
                <BranchFormDialog
                    editing={editing}
                    onClose={() => setShowForm(false)}
                    onSubmit={handleSubmit}
                />
            )}

            {selected && (
                <BranchDetailsDialog
                    branch={selected}
                    onClose={() => setSelected(null)}
                />
            )}

            <ConfirmDialog
                confirmLabel={t('branches.deleteConfirmLabel')}
                description={t('branches.deleteDescription').replace(
                    '{name}',
                    branchToDelete?.name ?? '',
                )}
                loading={deleting}
                open={Boolean(branchToDelete)}
                title={t('common.confirmDelete')}
                tone="danger"
                onCancel={() => setBranchToDelete(null)}
                onConfirm={() => void handleConfirmDelete()}
            />
        </section>
    );
}
