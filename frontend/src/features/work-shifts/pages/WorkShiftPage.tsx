import { useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCalendarDays,
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
import { useDebounce } from '@/hooks/useDebounce';
import { useI18n } from '@/i18n';
import {
    createWorkShift,
    deleteWorkShift,
    getWorkShift,
    getWorkShiftErrorKey,
    listWorkShifts,
    updateWorkShift,
} from '../api/work-shift.api';
import { WorkShiftDetailsDialog } from '../components/WorkShiftDetailsDialog';
import { WorkShiftFormDialog } from '../components/WorkShiftFormDialog';
import {
    type UpdateWorkShiftPayload,
    type WorkShift,
    type WorkShiftPayload,
    WorkShiftStatus,
    type WorkShiftStatusFilter,
} from '../types';

const pageSize = 10;

type WorkShiftPageProps = {
    canManage: boolean;
};

function formatDuration(minutes: number) {
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;

    if (!hours) return `${remainder}m`;
    if (!remainder) return `${hours}h`;
    return `${hours}h ${remainder}m`;
}

export default function WorkShiftPage({ canManage }: WorkShiftPageProps) {
    const { showToast } = useToast();
    const { t } = useI18n();
    const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] =
        useState<WorkShiftStatusFilter>('all');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState<WorkShift | null>(null);
    const [selected, setSelected] = useState<WorkShift | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [workShiftToDelete, setWorkShiftToDelete] =
        useState<WorkShift | null>(null);
    const [deleting, setDeleting] = useState(false);
    const debouncedSearch = useDebounce(search);

    const loadWorkShifts = useCallback(async () => {
        setLoading(true);

        try {
            const response = await listWorkShifts({
                page,
                limit: pageSize,
                search: debouncedSearch.trim() || undefined,
                status:
                    statusFilter === 'all'
                        ? undefined
                        : statusFilter === 'active'
                            ? WorkShiftStatus.Active
                            : WorkShiftStatus.Inactive,
            });

            setWorkShifts(response.data);
            setTotalPages(response.meta.totalPages);
        } catch (error) {
            showToast({
                message: t(getWorkShiftErrorKey(error)),
                title: t('workShifts.loadError'),
                variant: 'error',
            });
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, page, showToast, statusFilter, t]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadWorkShifts();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [loadWorkShifts]);

    async function handleSave(
        payload: WorkShiftPayload | UpdateWorkShiftPayload,
    ) {
        setSaving(true);

        try {
            if (editing) {
                await updateWorkShift(
                    editing.id,
                    payload as UpdateWorkShiftPayload,
                );
            } else {
                await createWorkShift(payload as WorkShiftPayload);
            }

            const wasEditing = Boolean(editing);
            setShowForm(false);
            setEditing(null);
            await loadWorkShifts();
            showToast({
                message: wasEditing
                    ? t('workShifts.updated')
                    : t('workShifts.created'),
                title: t('common.success'),
                variant: 'success',
            });
        } catch (error) {
            showToast({
                message: t(getWorkShiftErrorKey(error)),
                title: t('workShifts.saveError'),
                variant: 'error',
            });
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!workShiftToDelete) return;

        setDeleting(true);

        try {
            await deleteWorkShift(workShiftToDelete.id);
            const deletedName = workShiftToDelete.name;
            setWorkShiftToDelete(null);
            await loadWorkShifts();
            showToast({
                message: t('workShifts.deleted').replace('{name}', deletedName),
                variant: 'success',
            });
        } catch (error) {
            showToast({
                message: t(getWorkShiftErrorKey(error)),
                title: t('workShifts.deleteError'),
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
                        {t('workShifts.add')}
                    </Button>
                )}
                description={t('workShifts.subtitle')}
                icon={<FontAwesomeIcon icon={faCalendarDays} />}
                title={t('workShifts.title')}
            />

            <div className="relative overflow-hidden rounded-[14px] border border-rule bg-paper">
                <LoadingOverlay
                    label={t('workShifts.loading')}
                    visible={loading}
                />
                <div className="flex flex-wrap items-center gap-3 border-b border-rule px-5 py-4">
                    <label className="relative min-w-64 flex-1">
                        <FontAwesomeIcon
                            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-faint"
                            icon={faSearch}
                        />
                        <input
                            className="min-h-10 w-full rounded-lg border border-rule-strong bg-white pr-3 pl-9 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-ink"
                            placeholder={t('workShifts.searchPlaceholder')}
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                        />
                    </label>

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
                            setStatusFilter(value as WorkShiftStatusFilter);
                            setPage(1);
                        }}
                    />

                    <Button
                        onClick={() => void loadWorkShifts()}
                        size="lg"
                        variant="secondary"
                    >
                        <FontAwesomeIcon icon={faRotateRight} />
                        {t('common.refresh')}
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="data-table w-full min-w-[960px] table-fixed">
                        <thead>
                            <tr>
                                <th className="w-[12%]">
                                    {t('common.code')}
                                </th>
                                <th className="w-[18%]">
                                    {t('common.name')}
                                </th>
                                <th className="w-[16%]">
                                    {t('workShifts.timeRange')}
                                </th>
                                <th className="w-[10%]">
                                    {t('workShifts.overnight')}
                                </th>
                                <th className="w-[10%]">
                                    {t('common.status')}
                                </th>
                                <th className="cell-actions w-[14%]">
                                    {t('common.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading &&
                                workShifts.map((workShift) => (
                                    <tr
                                        className="border-b border-rule-soft hover:bg-[#f6f4ef]"
                                        key={workShift.id}
                                    >
                                        <td className="font-semibold">
                                            {workShift.code}
                                        </td>
                                        <td>
                                            {workShift.name}
                                        </td>
                                        <td>
                                            {workShift.startTime.slice(0, 5)} -{' '}
                                            {workShift.endTime.slice(0, 5)}
                                        </td>
                                        <td>
                                            {workShift.isOvernight
                                                ? t('workShifts.yes')
                                                : t('workShifts.no')}
                                        </td>
                                        <td>
                                            <span
                                                className={`inline-flex items-center rounded-full px-[9px] py-[3px] text-xs font-semibold whitespace-nowrap ${workShift.status ===
                                                    WorkShiftStatus.Active
                                                    ? 'bg-[#dff0e4] text-[#1f6237]'
                                                    : 'bg-ember-tint text-ember-ink'
                                                    }`}
                                            >
                                                {workShift.status ===
                                                    WorkShiftStatus.Active
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
                                                        void getWorkShift(
                                                            workShift.id,
                                                        ).then(setSelected)
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
                                                                    workShift,
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
                                                                setWorkShiftToDelete(
                                                                    workShift,
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
                            {!loading && workShifts.length === 0 && (
                                <tr>
                                    <td colSpan={8}>
                                        <EmptyState
                                            description={t(
                                                'workShifts.noResultsDescription',
                                            )}
                                            icon={
                                                <FontAwesomeIcon
                                                    icon={faCalendarDays}
                                                />
                                            }
                                            title={t(
                                                'workShifts.noResultsTitle',
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
                <WorkShiftFormDialog
                    editing={editing}
                    saving={saving}
                    onClose={() => {
                        setShowForm(false);
                        setEditing(null);
                    }}
                    onSubmit={handleSave}
                />
            )}
            {selected && (
                <WorkShiftDetailsDialog
                    workShift={selected}
                    onClose={() => setSelected(null)}
                />
            )}
            <ConfirmDialog
                confirmLabel={t('workShifts.deleteConfirmLabel')}
                description={t('workShifts.deleteDescription').replace(
                    '{name}',
                    workShiftToDelete?.name ?? '',
                )}
                loading={deleting}
                open={Boolean(workShiftToDelete)}
                title={t('common.confirmDelete')}
                tone="danger"
                onCancel={() => setWorkShiftToDelete(null)}
                onConfirm={() => void handleDelete()}
            />
        </section>
    );
}
