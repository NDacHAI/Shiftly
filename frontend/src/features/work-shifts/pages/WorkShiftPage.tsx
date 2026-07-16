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
    LoadingOverlay,
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
        <section className="mx-auto grid max-w-[1440px] gap-5 p-6 max-sm:p-4">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
                <div className="flex items-center gap-4">
                    <span className="flex size-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                        <FontAwesomeIcon icon={faCalendarDays} />
                    </span>
                    <div>
                        <h2 className="text-xl font-bold text-slate-950">
                            {t('workShifts.title')}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {t('workShifts.subtitle')}
                        </p>
                    </div>
                </div>

                {canManage && (
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
            </div>

            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <LoadingOverlay
                    label={t('workShifts.loading')}
                    visible={loading}
                />
                <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
                    <label className="relative min-w-64 flex-1">
                        <FontAwesomeIcon
                            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
                            icon={faSearch}
                        />
                        <input
                            className="min-h-11 w-full rounded-lg border border-slate-200 pl-9 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
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
                    <table className="w-full min-w-[960px] table-fixed">
                        <thead className="bg-slate-50">
                            <tr className="border-b border-slate-200">
                                <th className="w-[12%] px-4 py-3 text-center text-xs text-slate-600">
                                    {t('common.code')}
                                </th>
                                <th className="w-[18%] px-4 py-3 text-center text-xs text-slate-600">
                                    {t('common.name')}
                                </th>
                                <th className="w-[16%] px-4 py-3 text-center text-xs text-slate-600">
                                    {t('workShifts.timeRange')}
                                </th>
                                <th className="w-[10%] px-4 py-3 text-center text-xs text-slate-600">
                                    {t('workShifts.overnight')}
                                </th>
                                <th className="w-[10%] px-4 py-3 text-center text-xs text-slate-600">
                                    {t('common.status')}
                                </th>
                                <th className="w-[14%] px-4 py-3 text-center text-xs text-slate-600">
                                    {t('common.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading &&
                                workShifts.map((workShift) => (
                                    <tr
                                        className="border-b border-slate-100 hover:bg-slate-50"
                                        key={workShift.id}
                                    >
                                        <td className="px-4 py-3 text-center text-sm font-semibold">
                                            {workShift.code}
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm">
                                            {workShift.name}
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm">
                                            {workShift.startTime.slice(0, 5)} -{' '}
                                            {workShift.endTime.slice(0, 5)}
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm">
                                            {workShift.isOvernight
                                                ? t('workShifts.yes')
                                                : t('workShifts.no')}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${workShift.status ===
                                                    WorkShiftStatus.Active
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : 'bg-amber-50 text-amber-700'
                                                    }`}
                                            >
                                                {workShift.status ===
                                                    WorkShiftStatus.Active
                                                    ? t('common.active')
                                                    : t('common.inactive')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    aria-label={t('common.view')}
                                                    className="flex size-9 min-h-0 cursor-pointer items-center justify-center rounded-lg border border-primary-100 bg-primary-50 p-0 text-primary-600 transition hover:border-primary-300 hover:bg-primary-600 hover:text-white"
                                                    onClick={() =>
                                                        void getWorkShift(
                                                            workShift.id,
                                                        ).then(setSelected)
                                                    }
                                                    title={t('common.view')}
                                                    type="button"
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
                                                            onClick={() => {
                                                                setEditing(
                                                                    workShift,
                                                                );
                                                                setShowForm(true);
                                                            }}
                                                            title={t('common.edit')}
                                                            type="button"
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
                                                            onClick={() =>
                                                                setWorkShiftToDelete(
                                                                    workShift,
                                                                )
                                                            }
                                                            title={t(
                                                                'common.delete',
                                                            )}
                                                            type="button"
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
