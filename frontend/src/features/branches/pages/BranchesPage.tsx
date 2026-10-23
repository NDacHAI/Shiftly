import { useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBuilding,
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
    createBranch,
    deleteBranch,
    getBranch,
    getBranchErrorKey,
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

function formatDate(value: string) {
    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(value));
}

type BranchesPageProps = {
    canManage: boolean;
};

export function BranchesPage({ canManage }: BranchesPageProps) {
    const { showToast } = useToast();
    const { t } = useI18n();
    const [branches, setBranches] = useState<Branch[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
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
            setTotalPages(response.meta.totalPages);

            if (
                response.meta.totalPages > 0 &&
                page > response.meta.totalPages
            ) {
                setPage(response.meta.totalPages);
            }
        } catch (loadError) {
            setError(t(getBranchErrorKey(loadError)));
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
            const message = t(getBranchErrorKey(viewError));
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
            const message = t(getBranchErrorKey(deleteError));
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
                        {t('branches.add')}
                    </Button>
                )}
                description={t('branches.subtitle')}
                icon={<FontAwesomeIcon icon={faBuilding} />}
                title={t('branches.title')}
            />

            {error && (
                <div className="rounded-lg border border-[#efc4b9] bg-[#f6dcd6] px-4 py-3 text-sm text-[#9a2f1f]">
                    {error}
                </div>
            )}

            <div className="relative overflow-hidden rounded-[14px] border border-rule bg-paper">
                <LoadingOverlay label={t('branches.loading')} visible={loading} />
                <div className="flex items-center justify-between gap-4 border-b border-rule px-5 py-4 max-md:items-stretch max-md:flex-col">
                    <label className="relative block w-full max-w-sm">
                        <span className="sr-only">{t('common.search')}</span>
                        <FontAwesomeIcon
                            className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-faint"
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
                                className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted"
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
                    <table className="data-table w-full min-w-[820px] table-fixed border-collapse">
                        <thead>
                            <tr>
                                {(
                                    [
                                        ['code', t('common.code')],
                                        ['name', t('common.name')],
                                        ['status', t('common.status')],
                                        ['createdAt', t('common.createdAt')],
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
                                displayedBranches.map((branch) => (
                                    <tr
                                        className="border-b border-rule-soft transition hover:bg-[#f6f4ef] last:border-0"
                                        key={branch.id}
                                    >
                                        <td className="font-semibold text-ink">
                                            {branch.code}
                                        </td>
                                        <td>
                                            {branch.name}
                                        </td>
                                        <td>
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-full px-[9px] py-[3px] text-xs font-semibold whitespace-nowrap ${
                                                    branch.status
                                                        ? 'bg-[#dff0e4] text-[#1f6237]'
                                                        : 'bg-ember-tint text-ember-ink'
                                                }`}
                                            >
                                                <span
                                                    className={`size-1.5 rounded-full ${
                                                        branch.status
                                                            ? 'bg-live'
                                                            : 'bg-ember'
                                                    }`}
                                                />
                                                {branch.status
                                                    ? t('common.active')
                                                    : t('common.inactive')}
                                            </span>
                                        </td>
                                        <td>
                                            {formatDate(branch.createdAt)}
                                        </td>
                                        <td className="cell-actions">
                                            <div className="flex items-center justify-end gap-1">
                                                <IconButton
                                                    icon={faEye}
                                                    label={t('common.view')}
                                                    onClick={() =>
                                                        void handleView(branch.id)
                                                    }
                                                />
                                                {canManage && (
                                                    <>
                                                        <IconButton
                                                            icon={faPen}
                                                            label={t('common.edit')}
                                                            onClick={() => {
                                                                setEditing(branch);
                                                                setShowForm(true);
                                                            }}
                                                            tone="primary"
                                                        />
                                                        <IconButton
                                                            icon={faTrash}
                                                            label={t('common.delete')}
                                                            onClick={() =>
                                                                setBranchToDelete(
                                                                    branch,
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
