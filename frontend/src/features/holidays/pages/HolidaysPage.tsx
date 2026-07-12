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
    LoadingOverlay,
    Pagination,
} from '@/components/ui';
import { useDebounce } from '@/hooks/useDebounce';
import { useI18n } from '@/i18n';
import {
    createHoliday,
    deleteHoliday,
    getHoliday,
    getHolidayErrorMessage,
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

const fieldClass =
    'min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500';

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
            setError(getHolidayErrorMessage(loadError));
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
            const message = getHolidayErrorMessage(viewError);
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
            const message = getHolidayErrorMessage(deleteError);
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
            <div className="flex items-center justify-between gap-5 rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm max-sm:items-stretch max-sm:flex-col">
                <div className="flex items-center gap-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xl text-primary-600">
                        <FontAwesomeIcon icon={faCalendarDay} />
                    </span>
                    <div>
                        <h2 className="text-xl font-bold text-slate-950">
                            {t('holidays.title')}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {t('holidays.subtitle')}
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
                        {t('holidays.add')}
                    </Button>
                )}
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
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
                    <table className="w-full min-w-[820px] table-fixed border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                {(
                                    [
                                        ['name', t('holidays.name')],
                                        ['holidayDate', t('holidays.holidayDate')],
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
                                holidays.map((holiday) => (
                                    <tr
                                        className="border-b border-slate-100 transition hover:bg-slate-50/80 last:border-0"
                                        key={holiday.id}
                                    >
                                        <td className="px-5 py-3.5 text-center text-sm font-semibold text-slate-800">
                                            {holiday.name}
                                        </td>
                                        <td className="px-5 py-3.5 text-center text-sm text-slate-700">
                                            {formatDate(holiday.holidayDate)}
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
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
                                        <td className="px-5 py-3.5 text-center text-sm text-slate-600">
                                            {formatDate(holiday.createdAt.slice(0, 10))}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    aria-label={t('common.view')}
                                                    className="flex size-9 min-h-0 cursor-pointer items-center justify-center rounded-lg border border-primary-100 bg-primary-50 p-0 text-primary-600 transition hover:border-primary-300 hover:bg-primary-600 hover:text-white"
                                                    onClick={() =>
                                                        void handleView(holiday.id)
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
                                                                    holiday,
                                                                );
                                                                setShowForm(true);
                                                            }}
                                                            title={t(
                                                                'common.edit',
                                                            )}
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
                                                                setHolidayToDelete(
                                                                    holiday,
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
