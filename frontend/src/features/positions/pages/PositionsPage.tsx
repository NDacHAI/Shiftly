import { useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBriefcase,
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
    IconButton,
    LoadingOverlay,
    PageHeader,
    Pagination,
} from '@/components/ui';
import { listBranches } from '@/features/branches/api/branches.api';
import { type Branch } from '@/features/branches/types';
import { useDebounce } from '@/hooks/useDebounce';
import { useI18n } from '@/i18n';
import {
    createPosition,
    deletePosition,
    getPosition,
    getPositionErrorKey,
    listPositions,
    updatePosition,
    updatePositionStatus,
} from '../api/positions.api';
import { PositionDetailsDialog } from '../components/PositionDetailsDialog';
import { PositionFormDialog } from '../components/PositionFormDialog';
import {
    type Position,
    type PositionPayload,
    type PositionSortField,
    type SortOrder,
    type UpdatePositionPayload,
} from '../types';

const pageSize = 10;
type StatusFilter = 'all' | 'active' | 'inactive';

type PositionsPageProps = {
    canManage: boolean;
};

export function PositionsPage({ canManage }: PositionsPageProps) {
    const { showToast } = useToast();
    const { t } = useI18n();
    const [positions, setPositions] = useState<Position[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [search, setSearch] = useState('');
    const [branchId, setBranchId] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [sortBy, setSortBy] = useState<PositionSortField>('createdAt');
    const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<Position | null>(null);
    const [selected, setSelected] = useState<Position | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [positionToDelete, setPositionToDelete] =
        useState<Position | null>(null);
    const [deleting, setDeleting] = useState(false);
    const debouncedSearch = useDebounce(search);

    function formatCurrency(value: string) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(Number(value));
    }

    const loadPositions = useCallback(async () => {
        setLoading(true);

        try {
            const response = await listPositions({
                page,
                limit: pageSize,
                search: debouncedSearch || undefined,
                branchId: branchId || undefined,
                status:
                    statusFilter === 'all'
                        ? undefined
                        : statusFilter === 'active',
                sortBy,
                sortOrder,
            });
            setPositions(response.data);
            setTotalPages(response.meta.totalPages);
        } catch (error) {
            showToast({
                message: t(getPositionErrorKey(error)),
                title: t('positions.loadError'),
                variant: 'error',
            });
        } finally {
            setLoading(false);
        }
    }, [
        debouncedSearch,
        branchId,
        page,
        showToast,
        sortBy,
        sortOrder,
        statusFilter,
        t,
    ]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadPositions();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [loadPositions]);

    useEffect(() => {
        let active = true;

        void listBranches({
            page: 1,
            limit: 100,
            sortBy: 'name',
            sortOrder: 'ASC',
        })
            .then((response) => {
                if (active) setBranches(response.data);
            })
            .catch(() => {
                showToast({
                    message: t('positions.branchesLoadError'),
                    variant: 'error',
                });
            });

        return () => {
            active = false;
        };
    }, [showToast, t]);

    function changeSort(field: PositionSortField) {
        if (sortBy === field) {
            setSortOrder((current) => (current === 'ASC' ? 'DESC' : 'ASC'));
        } else {
            setSortBy(field);
            setSortOrder('ASC');
        }
        setPage(1);
    }

    async function handleSave(
        payload: PositionPayload | UpdatePositionPayload,
    ) {
        if (editing) {
            await updatePosition(editing.id, payload as UpdatePositionPayload);
        } else {
            await createPosition(payload as PositionPayload);
        }

        const wasEditing = Boolean(editing);
        setShowForm(false);
        setEditing(null);
        await loadPositions();
        showToast({
            message: wasEditing ? t('positions.updated') : t('positions.created'),
            title: t('common.success'),
            variant: 'success',
        });
    }

    async function handleStatusChange(position: Position) {
        try {
            await updatePositionStatus(position.id, !position.status);
            await loadPositions();
            showToast({
                message: t('positions.statusUpdated'),
                variant: 'success',
            });
        } catch (error) {
            showToast({
                message: t(getPositionErrorKey(error)),
                title: t('positions.statusUpdateError'),
                variant: 'error',
            });
        }
    }

    async function handleDelete() {
        if (!positionToDelete) return;

        setDeleting(true);

        try {
            await deletePosition(positionToDelete.id);
            setPositionToDelete(null);
            await loadPositions();
            showToast({
                message: t('positions.deleted'),
                variant: 'success',
            });
        } catch (error) {
            showToast({
                message: t(getPositionErrorKey(error)),
                title: t('positions.deleteError'),
                variant: 'error',
            });
        } finally {
            setDeleting(false);
        }
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
                        {t('positions.add')}
                    </Button>
                )}
                description={t('positions.subtitle')}
                icon={<FontAwesomeIcon icon={faBriefcase} />}
                title={t('positions.title')}
            />

            <div className="relative overflow-hidden rounded-[14px] border border-rule bg-paper">
                <LoadingOverlay label={t('positions.loading')} visible={loading} />
                <div className="flex flex-wrap items-center gap-3 border-b border-rule px-5 py-4">
                    <label className="relative min-w-64 flex-1">
                        <FontAwesomeIcon
                            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-faint"
                            icon={faSearch}
                        />
                        <input
                            className="min-h-10 w-full rounded-lg border border-rule-strong bg-white pr-3 pl-9 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-ink"
                            placeholder={t('positions.searchPlaceholder')}
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                        />
                    </label>
                    <DropdownSelect
                        ariaLabel={t('common.branch')}
                        options={[
                            {
                                value: '',
                                label: t('common.allBranches'),
                            },
                            ...branches.map((branch) => ({
                                value: branch.id,
                                label: branch.name,
                            })),
                        ]}
                        value={branchId}
                        onChange={(value) => {
                            setBranchId(value);
                            setPage(1);
                        }}
                    />
                    <DropdownSelect
                        ariaLabel={t('common.status')}
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
                            setStatusFilter(value as StatusFilter);
                            setPage(1);
                        }}
                    />
                    <Button
                        onClick={() => void loadPositions()}
                        size="lg"
                        variant="secondary"
                    >
                        <FontAwesomeIcon icon={faRotateRight} />
                        {t('common.refresh')}
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="data-table w-full min-w-[980px] table-fixed">
                        <thead>
                            <tr>
                                <th className="w-[16%]">
                                    {t('common.code')}
                                </th>
                                {(
                                    [
                                        ['name', t('common.name')],
                                        ['createdAt', t('common.createdAt')],
                                    ] as const
                                ).map(([field, label]) => (
                                    <th
                                        className="w-[22%]"
                                        key={field}
                                    >
                                        <button
                                            className="cursor-pointer hover:text-ink"
                                            onClick={() => changeSort(field)}
                                            type="button"
                                        >
                                            {label}
                                            {sortBy === field
                                                ? sortOrder === 'ASC'
                                                    ? ' ^'
                                                    : ' v'
                                                : ''}
                                        </button>
                                    </th>
                                ))}
                                <th className="w-[20%]">
                                    {t('common.branch')}
                                </th>
                                <th className="w-[14%]">
                                    {t('positions.hourlyRate')}
                                </th>
                                <th className="w-[16%]">
                                    {t('common.status')}
                                </th>
                                <th className="cell-actions w-[20%]">
                                    {t('common.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading &&
                                positions.map((position) => (
                                    <tr
                                        className="border-b border-rule-soft hover:bg-[#f6f4ef]"
                                        key={position.id}
                                    >
                                        <td className="font-semibold">
                                            {position.code}
                                        </td>
                                        <td>
                                            {position.name}
                                        </td>
                                        <td>
                                            {new Date(
                                                position.createdAt,
                                            ).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td>
                                            {position.branch.name}
                                        </td>
                                        <td className="font-medium">
                                            {formatCurrency(position.hourlyRate)}
                                        </td>
                                        <td>
                                            <button
                                                className={`inline-flex items-center rounded-full px-[9px] py-[3px] text-xs font-semibold whitespace-nowrap ${
                                                    canManage
                                                        ? 'cursor-pointer'
                                                        : 'cursor-default'
                                                } ${
                                                    position.status
                                                        ? 'bg-[#dff0e4] text-[#1f6237]'
                                                        : 'bg-ember-tint text-ember-ink'
                                                }`}
                                                disabled={!canManage}
                                                onClick={() =>
                                                    void handleStatusChange(position)
                                                }
                                                type="button"
                                            >
                                                {position.status
                                                    ? t('common.active')
                                                    : t('common.inactive')}
                                            </button>
                                        </td>
                                        <td className="cell-actions">
                                            <div className="flex items-center justify-end gap-1">
                                                <IconButton
                                                    icon={faEye}
                                                    label={t('common.view')}
                                                    onClick={() =>
                                                        void getPosition(
                                                            position.id,
                                                        ).then(setSelected)
                                                    }
                                                />
                                                {canManage && (
                                                    <>
                                                        <IconButton
                                                            icon={faPen}
                                                            label={t('common.edit')}
                                                            onClick={() => {
                                                                setEditing(position);
                                                                setShowForm(true);
                                                            }}
                                                            tone="primary"
                                                        />
                                                        <IconButton
                                                            icon={faTrash}
                                                            label={t('common.delete')}
                                                            onClick={() =>
                                                                setPositionToDelete(
                                                                    position,
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
                            {!loading && positions.length === 0 && (
                                <tr>
                                    <td colSpan={7}>
                                        <EmptyState
                                            description={t(
                                                'positions.noResultsDescription',
                                            )}
                                            icon={<FontAwesomeIcon icon={faBriefcase} />}
                                            title={t('positions.noResultsTitle')}
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
                <PositionFormDialog
                    branches={branches}
                    editing={editing}
                    onClose={() => setShowForm(false)}
                    onSubmit={handleSave}
                />
            )}
            {selected && (
                <PositionDetailsDialog
                    position={selected}
                    onClose={() => setSelected(null)}
                />
            )}
            <ConfirmDialog
                confirmLabel={t('positions.deleteConfirmLabel')}
                description={t('positions.deleteDescription').replace(
                    '{name}',
                    positionToDelete?.name ?? '',
                )}
                loading={deleting}
                open={Boolean(positionToDelete)}
                title={t('common.confirmDelete')}
                tone="danger"
                onCancel={() => setPositionToDelete(null)}
                onConfirm={() => void handleDelete()}
            />
        </section>
    );
}
