import { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCalendarDay,
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
    createHoliday,
    deleteHoliday,
    getHoliday,
    getHolidayErrorKey,
    listHolidays,
    updateHoliday,
} from '../api/holidays.api';
import { HolidayDetailsDialog } from '../components/HolidayDetailsDialog';
import { HolidayFormDialog } from '../components/HolidayFormDialog';
import {
    type Holiday,
    type HolidayPayload,
    type HolidaySortField,
    type HolidayStatusFilter,
    HolidayStatus,
    type SortOrder,
    type UpdateHolidayPayload,
} from '../types';

const pageSize = 10;

type HolidaysPageProps = {
    canManage: boolean;
};

function formatDate(value: string) {
    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
    }).format(new Date(`${value}T00:00:00`));
}

function statusFromFilter(filter: HolidayStatusFilter) {
    if (filter === 'active') return HolidayStatus.Active;
    if (filter === 'inactive') return HolidayStatus.Inactive;
    return undefined;
}

export function HolidaysPage({ canManage }: HolidaysPageProps) {
    const { showToast } = useToast();
    const { t } = useI18n();
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search);
    const [year, setYear] = useState('');
    const [statusFilter, setStatusFilter] =
        useState<HolidayStatusFilter>('all');
    const [sortBy, setSortBy] = useState<HolidaySortField>('holidayDate');
    const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');
    const [editing, setEditing] = useState<Holiday | null>(null);
    const [selected, setSelected] = useState<Holiday | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [holidayToDelete, setHolidayToDelete] = useState<Holiday | null>(null);

    const parsedYear = useMemo(() => {
        if (!year.trim()) return undefined;
        const value = Number(year);
        return Number.isInteger(value) ? value : undefined;
    }, [year]);

    const loadHolidays = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const response = await listHolidays({
                page,
                limit: pageSize,
                search: debouncedSearch || undefined,
                year: parsedYear,
                status: canManage ? statusFromFilter(statusFilter) : undefined,
                sortBy,
                sortOrder,
            });
            setHolidays(response.data);
            setTotalPages(response.meta.totalPages);

            if (
                response.meta.totalPages > 0 &&
                page > response.meta.totalPages
            ) {
                setPage(response.meta.totalPages);
            }
        } catch (loadError) {
            setError(t(getHolidayErrorKey(loadError)));
        } finally {
            setLoading(false);
        }
    }, [
        canManage,
        debouncedSearch,
        page,
        parsedYear,
        sortBy,
        sortOrder,
        statusFilter,
    ]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadHolidays();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [loadHolidays]);

    async function handleSubmit(
        payload: HolidayPayload | UpdateHolidayPayload,
    ) {
        setSaving(true);
        try {
            if (editing) {
                await updateHoliday(editing.id, payload);
            } else {
                await createHoliday(payload as HolidayPayload);
            }

            const wasEditing = Boolean(editing);
            setShowForm(false);
            setEditing(null);
            await loadHolidays();
            showToast({
                message: wasEditing
                    ? t('holidays.updated')
                    : t('holidays.created'),
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
            setSelected(await getHoliday(id));
        } catch (viewError) {
            const message = t(getHolidayErrorKey(viewError));
            setError(message);
            showToast({
                message,
                title: t('holidays.viewError'),
                variant: 'error',
            });
        }
    }

    async function handleConfirmDelete() {
        if (!holidayToDelete) return;

        setDeleting(true);
        setError('');

        try {
            await deleteHoliday(holidayToDelete.id);
            if (selected?.id === holidayToDelete.id) setSelected(null);
            const deletedName = holidayToDelete.name;
            setHolidayToDelete(null);
            await loadHolidays();
            showToast({
                message: t('holidays.deleted').replace('{name}', deletedName),
                title: t('common.success'),
                variant: 'success',
            });
        } catch (deleteError) {
            const message = t(getHolidayErrorKey(deleteError));
            setError(message);
            showToast({
                message,
                title: t('holidays.deleteError'),
                variant: 'error',
            });
        } finally {
            setDeleting(false);
        }
    }

    function changeSort(field: HolidaySortField) {
        if (sortBy === field) {
            setSortOrder((current) => (current === 'ASC' ? 'DESC' : 'ASC'));
        } else {
            setSortBy(field);
            setSortOrder('ASC');
        }
        setPage(1);
    }

    function sortLabel(field: HolidaySortField) {
        if (sortBy !== field) return '';
        return sortOrder === 'ASC' ? ' ^' : ' v';
    }

    return (
        <section className="mx-auto grid max-w-[1440px] gap-5 p-6 max-sm:p-4">
            <PageHeader
                actions={canManage && (
                    <Button
                        className="shadow-sm"
                        onClick={() => {
                            setEditing(null);
                            setShowForm(true);
                        }}
                        size="lg"
                    >
                        <FontAwesomeIcon icon={faPlus} />
                        {t('holidays.add')}
                    </Button>
                )}
                description={t('holidays.subtitle')}
                icon={<FontAwesomeIcon icon={faCalendarDay} />}
                title={t('holidays.title')}
            />

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="relative overflow-hidden rounded-xl border border-line bg-white shadow-card">
                <LoadingOverlay label={t('holidays.loading')} visible={loading} />
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
                            placeholder={t('holidays.searchPlaceholder')}
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                        />
                    </label>

                    <div className="flex items-center gap-3 max-sm:flex-col">
                        <input
                            aria-label={t('holidays.year')}
                            className={`${fieldClass} w-32 max-sm:w-full`}
                            max={2100}
                            min={1900}
                            placeholder={t('holidays.year')}
                            type="number"
                            value={year}
                            onChange={(event) => {
                                setYear(event.target.value);
                                setPage(1);
                            }}
                        />
                        {canManage && (
                            <label className="relative">
                                <span className="sr-only">
                                    {t('common.status')}
                                </span>
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
                                    onChange={(value) => {
                                        setStatusFilter(
                                            value as HolidayStatusFilter,
                                        );
                                        setPage(1);
                                    }}
                                />
                            </label>
                        )}
                        <Button
                            className="max-sm:w-full"
                            onClick={() => void loadHolidays()}
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
                                        ['name', t('holidays.name')],
                                        ['holidayDate', t('holidays.holidayDate')],
                                        ['status', t('common.status')],
                                        ['createdAt', t('common.createdAt')],
                                    ] as const
                                ).map(([field, label]) => (
                                    <th
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
                                <th className="cell-actions">
                                    {t('common.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading &&
                                holidays.map((holiday) => (
                                    <tr
                                        className="border-b border-slate-100 transition hover:bg-slate-50/80 last:border-0"
                                        key={holiday.id}
                                    >
                                        <td className="font-semibold text-slate-900">
                                            {holiday.name}
                                        </td>
                                        <td>
                                            {formatDate(holiday.holidayDate)}
                                        </td>
                                        <td>
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-current/15 ring-inset ${
                                                    holiday.status ===
                                                    HolidayStatus.Active
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-amber-50 text-amber-700'
                                                }`}
                                            >
                                                <span
                                                    className={`size-1.5 rounded-full ${
                                                        holiday.status ===
                                                        HolidayStatus.Active
                                                            ? 'bg-emerald-500'
                                                            : 'bg-amber-500'
                                                    }`}
                                                />
                                                {holiday.status ===
                                                HolidayStatus.Active
                                                    ? t('common.active')
                                                    : t('common.inactive')}
                                            </span>
                                        </td>
                                        <td>
                                            {formatDate(holiday.createdAt.slice(0, 10))}
                                        </td>
                                        <td className="cell-actions">
                                            <div className="flex items-center justify-end gap-1">
                                                <IconButton
                                                    icon={faEye}
                                                    label={t('common.view')}
                                                    onClick={() =>
                                                        void handleView(holiday.id)
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
                                                                    holiday,
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
                                                                setHolidayToDelete(
                                                                    holiday,
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
                            {!loading && holidays.length === 0 && (
                                <tr>
                                    <td colSpan={5}>
                                        <EmptyState
                                            description={t(
                                                'holidays.noResultsDescription',
                                            )}
                                            icon={
                                                <FontAwesomeIcon
                                                    icon={faCalendarDay}
                                                />
                                            }
                                            title={t('holidays.noResultsTitle')}
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
                <HolidayFormDialog
                    editing={editing}
                    saving={saving}
                    onClose={() => setShowForm(false)}
                    onSubmit={handleSubmit}
                />
            )}

            {selected && (
                <HolidayDetailsDialog
                    holiday={selected}
                    onClose={() => setSelected(null)}
                />
            )}

            <ConfirmDialog
                confirmLabel={t('holidays.deleteConfirmLabel')}
                description={t('holidays.deleteDescription').replace(
                    '{name}',
                    holidayToDelete?.name ?? '',
                )}
                loading={deleting}
                open={Boolean(holidayToDelete)}
                title={t('common.confirmDelete')}
                tone="danger"
                onCancel={() => setHolidayToDelete(null)}
                onConfirm={() => void handleConfirmDelete()}
            />
        </section>
    );
}
