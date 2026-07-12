import { useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCoins,
    faEye,
    faFilter,
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
import { useI18n } from '@/i18n';
import {
    createRewardPenaltyCatalog,
    deleteRewardPenaltyCatalog,
    getRewardPenaltyCatalog,
    getRewardPenaltyCatalogErrorMessage,
    listRewardPenaltyCatalogs,
    updateRewardPenaltyCatalog,
} from '../api/reward-penalty-catalogs.api';
import { RewardPenaltyCatalogDetailsDialog } from '../components/RewardPenaltyCatalogDetailsDialog';
import { RewardPenaltyCatalogFormDialog } from '../components/RewardPenaltyCatalogFormDialog';
import {
    type RewardPenaltyCatalog,
    type RewardPenaltyCatalogPayload,
    type RewardPenaltyCatalogSortField,
    RewardPenaltyCategory,
    type RewardPenaltyCategoryFilter,
    RewardPenaltyStatus,
    type RewardPenaltyStatusFilter,
    type SortOrder,
    type UpdateRewardPenaltyCatalogPayload,
} from '../types';

const pageSize = 10;

const fieldClass =
    'min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500';

type RewardPenaltyCatalogsPageProps = {
    canManage: boolean;
};

function statusFromFilter(filter: RewardPenaltyStatusFilter) {
    if (filter === 'active') return RewardPenaltyStatus.Active;
    if (filter === 'inactive') return RewardPenaltyStatus.Inactive;
    return undefined;
}

function categoryFromFilter(filter: RewardPenaltyCategoryFilter) {
    if (filter === 'reward') return RewardPenaltyCategory.Reward;
    if (filter === 'penalty') return RewardPenaltyCategory.Penalty;
    return undefined;
}

function formatAmount(value: string) {
    return new Intl.NumberFormat('vi-VN').format(Number(value));
}

export function RewardPenaltyCatalogsPage({
    canManage,
}: RewardPenaltyCatalogsPageProps) {
    const { showToast } = useToast();
    const { t } = useI18n();
    const [catalogs, setCatalogs] = useState<RewardPenaltyCatalog[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search);
    const [categoryFilter, setCategoryFilter] =
        useState<RewardPenaltyCategoryFilter>('all');
    const [statusFilter, setStatusFilter] =
        useState<RewardPenaltyStatusFilter>('all');
    const [sortBy, setSortBy] =
        useState<RewardPenaltyCatalogSortField>('createdAt');
    const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');
    const [editing, setEditing] = useState<RewardPenaltyCatalog | null>(null);
    const [selected, setSelected] = useState<RewardPenaltyCatalog | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [catalogToDelete, setCatalogToDelete] =
        useState<RewardPenaltyCatalog | null>(null);

    const loadCatalogs = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const response = await listRewardPenaltyCatalogs({
                page,
                limit: pageSize,
                search: debouncedSearch || undefined,
                category: categoryFromFilter(categoryFilter),
                status: statusFromFilter(statusFilter),
                sortBy,
                sortOrder,
            });
            setCatalogs(response.data);
            setTotalPages(response.meta.totalPages);

            if (
                response.meta.totalPages > 0 &&
                page > response.meta.totalPages
            ) {
                setPage(response.meta.totalPages);
            }
        } catch (loadError) {
            setError(getRewardPenaltyCatalogErrorMessage(loadError));
        } finally {
            setLoading(false);
        }
    }, [
        categoryFilter,
        debouncedSearch,
        page,
        sortBy,
        sortOrder,
        statusFilter,
    ]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadCatalogs();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [loadCatalogs]);

    async function handleSubmit(
        payload:
            | RewardPenaltyCatalogPayload
            | UpdateRewardPenaltyCatalogPayload,
    ) {
        setSaving(true);
        try {
            if (editing) {
                await updateRewardPenaltyCatalog(editing.id, payload);
            } else {
                await createRewardPenaltyCatalog(
                    payload as RewardPenaltyCatalogPayload,
                );
            }

            const wasEditing = Boolean(editing);
            setShowForm(false);
            setEditing(null);
            await loadCatalogs();
            showToast({
                message: wasEditing
                    ? t('rewardPenaltyCatalogs.updated')
                    : t('rewardPenaltyCatalogs.created'),
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
            setSelected(await getRewardPenaltyCatalog(id));
        } catch (viewError) {
            const message = getRewardPenaltyCatalogErrorMessage(viewError);
            setError(message);
            showToast({
                message,
                title: t('rewardPenaltyCatalogs.viewError'),
                variant: 'error',
            });
        }
    }

    async function handleConfirmDelete() {
        if (!catalogToDelete) return;

        setDeleting(true);
        setError('');

        try {
            await deleteRewardPenaltyCatalog(catalogToDelete.id);
            if (selected?.id === catalogToDelete.id) setSelected(null);
            const deletedName = catalogToDelete.name;
            setCatalogToDelete(null);
            await loadCatalogs();
            showToast({
                message: t('rewardPenaltyCatalogs.deleted').replace(
                    '{name}',
                    deletedName,
                ),
                title: t('common.success'),
                variant: 'success',
            });
        } catch (deleteError) {
            const message = getRewardPenaltyCatalogErrorMessage(deleteError);
            setError(message);
            showToast({
                message,
                title: t('rewardPenaltyCatalogs.deleteError'),
                variant: 'error',
            });
        } finally {
            setDeleting(false);
        }
    }

    function changeSort(field: RewardPenaltyCatalogSortField) {
        if (sortBy === field) {
            setSortOrder((current) => (current === 'ASC' ? 'DESC' : 'ASC'));
        } else {
            setSortBy(field);
            setSortOrder('ASC');
        }
        setPage(1);
    }

    function sortLabel(field: RewardPenaltyCatalogSortField) {
        if (sortBy !== field) return '';
        return sortOrder === 'ASC' ? ' ^' : ' v';
    }

    function categoryLabel(category: RewardPenaltyCategory) {
        return category === RewardPenaltyCategory.Reward
            ? t('rewardPenaltyCatalogs.reward')
            : t('rewardPenaltyCatalogs.penalty');
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
                            {t('rewardPenaltyCatalogs.title')}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {t('rewardPenaltyCatalogs.subtitle')}
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
                        {t('rewardPenaltyCatalogs.add')}
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
                    label={t('rewardPenaltyCatalogs.loading')}
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
                            placeholder={t(
                                'rewardPenaltyCatalogs.searchPlaceholder',
                            )}
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                        />
                    </label>

                    <div className="flex items-center gap-3 max-sm:flex-col">
                        <label className="relative">
                            <span className="sr-only">
                                {t('rewardPenaltyCatalogs.category')}
                            </span>
                            <FontAwesomeIcon
                                className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-500"
                                icon={faFilter}
                            />
                            <DropdownSelect
                                ariaLabel={t(
                                    'rewardPenaltyCatalogs.category',
                                )}
                                className="max-sm:w-full"
                                options={[
                                    {
                                        value: 'all',
                                        label: t(
                                            'rewardPenaltyCatalogs.allCategories',
                                        ),
                                    },
                                    {
                                        value: 'reward',
                                        label: t(
                                            'rewardPenaltyCatalogs.reward',
                                        ),
                                    },
                                    {
                                        value: 'penalty',
                                        label: t(
                                            'rewardPenaltyCatalogs.penalty',
                                        ),
                                    },
                                ]}
                                value={categoryFilter}
                                onChange={(value) => {
                                    setCategoryFilter(
                                        value as RewardPenaltyCategoryFilter,
                                    );
                                    setPage(1);
                                }}
                            />
                        </label>
                        <label className="relative">
                            <span className="sr-only">{t('common.status')}</span>
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
                                onChange={(value) => {
                                    setStatusFilter(
                                        value as RewardPenaltyStatusFilter,
                                    );
                                    setPage(1);
                                }}
                            />
                        </label>
                        <Button
                            className="max-sm:w-full"
                            onClick={() => void loadCatalogs()}
                            size="lg"
                            variant="secondary"
                        >
                            <FontAwesomeIcon icon={faRotateRight} />
                            {t('common.refresh')}
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1060px] table-fixed border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                {(
                                    [
                                        ['code', t('rewardPenaltyCatalogs.code')],
                                        ['name', t('rewardPenaltyCatalogs.name')],
                                        [
                                            'category',
                                            t('rewardPenaltyCatalogs.category'),
                                        ],
                                        [
                                            'amount',
                                            t('rewardPenaltyCatalogs.amount'),
                                        ],
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
                                catalogs.map((catalog) => (
                                    <tr
                                        className="border-b border-slate-100 transition hover:bg-slate-50/80 last:border-0"
                                        key={catalog.id}
                                    >
                                        <td className="px-5 py-3.5 text-center text-sm font-semibold text-slate-800">
                                            {catalog.code}
                                        </td>
                                        <td className="px-5 py-3.5 text-center text-sm text-slate-700">
                                            {catalog.name}
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                    catalog.category ===
                                                    RewardPenaltyCategory.Reward
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-red-50 text-red-700'
                                                }`}
                                            >
                                                {categoryLabel(catalog.category)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-center text-sm font-semibold text-slate-800">
                                            {formatAmount(catalog.amount)}
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                    catalog.status ===
                                                    RewardPenaltyStatus.Active
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-amber-50 text-amber-700'
                                                }`}
                                            >
                                                <span
                                                    className={`size-1.5 rounded-full ${
                                                        catalog.status ===
                                                        RewardPenaltyStatus.Active
                                                            ? 'bg-emerald-500'
                                                            : 'bg-amber-500'
                                                    }`}
                                                />
                                                {catalog.status ===
                                                RewardPenaltyStatus.Active
                                                    ? t('common.active')
                                                    : t('common.inactive')}
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
                                                        void handleView(
                                                            catalog.id,
                                                        )
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
                                                            className="flex size-9 min-h-0 cursor-pointer items-center justify-center rounded-lg border border-blue-100 bg-blue-50 p-0 text-blue-600 transition hover:border-blue-300 hover:bg-blue-600 hover:text-white"
                                                            title={t(
                                                                'common.edit',
                                                            )}
                                                            type="button"
                                                            onClick={() => {
                                                                setEditing(
                                                                    catalog,
                                                                );
                                                                setShowForm(true);
                                                            }}
                                                        >
                                                            <FontAwesomeIcon
                                                                icon={faPen}
                                                            />
                                                        </button>
                                                        <button
                                                            aria-label={t(
                                                                'common.delete',
                                                            )}
                                                            className="flex size-9 min-h-0 cursor-pointer items-center justify-center rounded-lg border border-red-100 bg-red-50 p-0 text-red-600 transition hover:border-red-300 hover:bg-red-600 hover:text-white"
                                                            title={t(
                                                                'common.delete',
                                                            )}
                                                            type="button"
                                                            onClick={() =>
                                                                setCatalogToDelete(
                                                                    catalog,
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
                            {!loading && catalogs.length === 0 && (
                                <tr>
                                    <td colSpan={6}>
                                        <EmptyState
                                            description={t(
                                                'rewardPenaltyCatalogs.noResultsDescription',
                                            )}
                                            icon={<FontAwesomeIcon icon={faCoins} />}
                                            title={t(
                                                'rewardPenaltyCatalogs.noResultsTitle',
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
                <RewardPenaltyCatalogFormDialog
                    editing={editing}
                    saving={saving}
                    onClose={() => setShowForm(false)}
                    onSubmit={handleSubmit}
                />
            )}

            {selected && (
                <RewardPenaltyCatalogDetailsDialog
                    catalog={selected}
                    onClose={() => setSelected(null)}
                />
            )}

            <ConfirmDialog
                confirmLabel={t('rewardPenaltyCatalogs.deleteConfirmLabel')}
                description={t(
                    'rewardPenaltyCatalogs.deleteDescription',
                ).replace('{name}', catalogToDelete?.name ?? '')}
                loading={deleting}
                open={Boolean(catalogToDelete)}
                title={t('common.confirmDelete')}
                tone="danger"
                onCancel={() => setCatalogToDelete(null)}
                onConfirm={() => void handleConfirmDelete()}
            />
        </section>
    );
}
