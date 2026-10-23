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
    fieldClass,
    IconButton,
    LoadingOverlay,
    PageHeader,
    Pagination,
} from '@/components/ui';
import { useDebounce } from '@/hooks/useDebounce';
import { useI18n } from '@/i18n';
import {
    createRewardPenaltyCatalog,
    deleteRewardPenaltyCatalog,
    getRewardPenaltyCatalog,
    getRewardPenaltyCatalogErrorKey,
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
            setError(t(getRewardPenaltyCatalogErrorKey(loadError)));
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
            const message = t(getRewardPenaltyCatalogErrorKey(viewError));
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
            const message = t(getRewardPenaltyCatalogErrorKey(deleteError));
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
                        {t('rewardPenaltyCatalogs.add')}
                    </Button>
                )}
                description={t('rewardPenaltyCatalogs.subtitle')}
                icon={<FontAwesomeIcon icon={faCoins} />}
                title={t('rewardPenaltyCatalogs.title')}
            />

            {error && (
                <div className="rounded-lg border border-[#efc4b9] bg-[#f6dcd6] px-4 py-3 text-sm text-[#9a2f1f]">
                    {error}
                </div>
            )}

            <div className="relative overflow-hidden rounded-[14px] border border-rule bg-paper">
                <LoadingOverlay
                    label={t('rewardPenaltyCatalogs.loading')}
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
                                className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted"
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
                    <table className="data-table w-full min-w-[1060px] table-fixed border-collapse">
                        <thead>
                            <tr>
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
                                catalogs.map((catalog) => (
                                    <tr
                                        className="border-b border-rule-soft transition hover:bg-[#f6f4ef] last:border-0"
                                        key={catalog.id}
                                    >
                                        <td className="font-semibold text-ink">
                                            {catalog.code}
                                        </td>
                                        <td>
                                            {catalog.name}
                                        </td>
                                        <td>
                                            <span
                                                className={`inline-flex items-center rounded-full px-[9px] py-[3px] text-xs font-semibold whitespace-nowrap ${
                                                    catalog.category ===
                                                    RewardPenaltyCategory.Reward
                                                        ? 'bg-[#dff0e4] text-[#1f6237]'
                                                        : 'bg-[#f6dcd6] text-[#9a2f1f]'
                                                }`}
                                            >
                                                {categoryLabel(catalog.category)}
                                            </span>
                                        </td>
                                        <td className="font-semibold text-ink">
                                            {formatAmount(catalog.amount)}
                                        </td>
                                        <td>
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-full px-[9px] py-[3px] text-xs font-semibold whitespace-nowrap ${
                                                    catalog.status ===
                                                    RewardPenaltyStatus.Active
                                                        ? 'bg-[#dff0e4] text-[#1f6237]'
                                                        : 'bg-ember-tint text-ember-ink'
                                                }`}
                                            >
                                                <span
                                                    className={`size-1.5 rounded-full ${
                                                        catalog.status ===
                                                        RewardPenaltyStatus.Active
                                                            ? 'bg-live'
                                                            : 'bg-ember'
                                                    }`}
                                                />
                                                {catalog.status ===
                                                RewardPenaltyStatus.Active
                                                    ? t('common.active')
                                                    : t('common.inactive')}
                                            </span>
                                        </td>
                                        <td className="cell-actions">
                                            <div className="flex items-center justify-end gap-1">
                                                <IconButton
                                                    icon={faEye}
                                                    label={t('common.view')}
                                                    onClick={() =>
                                                        void handleView(
                                                            catalog.id,
                                                        )
                                                    }
                                                />
                                                {canManage && (
                                                    <>
                                                        <IconButton
                                                            icon={faPen}
                                                            label={t(
                                                                'common.edit',
                                                            )}
                                                            onClick={() => {
                                                                setEditing(
                                                                    catalog,
                                                                );
                                                                setShowForm(true);
                                                            }}
                                                            tone="primary"
                                                        />
                                                        <IconButton
                                                            icon={faTrash}
                                                            label={t(
                                                                'common.delete',
                                                            )}
                                                            onClick={() =>
                                                                setCatalogToDelete(
                                                                    catalog,
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
