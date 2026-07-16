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
    createSalaryRule,
    deleteSalaryRule,
    getSalaryRule,
    getSalaryRuleErrorKey,
    listSalaryRules,
    updateSalaryRule,
} from '../api/salary-rules.api';
import { SalaryRuleDetailsDialog } from '../components/SalaryRuleDetailsDialog';
import { SalaryRuleFormDialog } from '../components/SalaryRuleFormDialog';
import {
    type SalaryRule,
    type SalaryRulePayload,
    type SalaryRuleSortField,
    type SalaryRuleStatusFilter,
    SalaryRuleStatus,
    type SortOrder,
    type UpdateSalaryRulePayload,
} from '../types';

const pageSize = 10;

const fieldClass =
    'min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500';

type SalaryRulesPageProps = {
    canManage: boolean;
};

function statusFromFilter(filter: SalaryRuleStatusFilter) {
    if (filter === 'active') return SalaryRuleStatus.Active;
    if (filter === 'inactive') return SalaryRuleStatus.Inactive;
    return undefined;
}

export function SalaryRulesPage({ canManage }: SalaryRulesPageProps) {
    const { showToast } = useToast();
    const { t } = useI18n();
    const [salaryRules, setSalaryRules] = useState<SalaryRule[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search);
    const [statusFilter, setStatusFilter] =
        useState<SalaryRuleStatusFilter>('all');
    const [sortBy, setSortBy] = useState<SalaryRuleSortField>('createdAt');
    const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');
    const [editing, setEditing] = useState<SalaryRule | null>(null);
    const [selected, setSelected] = useState<SalaryRule | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [ruleToDelete, setRuleToDelete] = useState<SalaryRule | null>(null);

    const loadSalaryRules = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const response = await listSalaryRules({
                page,
                limit: pageSize,
                search: debouncedSearch || undefined,
                status: statusFromFilter(statusFilter),
                sortBy,
                sortOrder,
            });
            setSalaryRules(response.data);
            setTotalPages(response.meta.totalPages);

            if (
                response.meta.totalPages > 0 &&
                page > response.meta.totalPages
            ) {
                setPage(response.meta.totalPages);
            }
        } catch (loadError) {
            setError(t(getSalaryRuleErrorKey(loadError)));
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, page, sortBy, sortOrder, statusFilter]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadSalaryRules();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [loadSalaryRules]);

    async function handleSubmit(
        payload: SalaryRulePayload | UpdateSalaryRulePayload,
    ) {
        setSaving(true);
        try {
            if (editing) {
                await updateSalaryRule(editing.id, payload);
            } else {
                await createSalaryRule(payload as SalaryRulePayload);
            }

            const wasEditing = Boolean(editing);
            setShowForm(false);
            setEditing(null);
            await loadSalaryRules();
            showToast({
                message: wasEditing
                    ? t('salaryRules.updated')
                    : t('salaryRules.created'),
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
            setSelected(await getSalaryRule(id));
        } catch (viewError) {
            const message = t(getSalaryRuleErrorKey(viewError));
            setError(message);
            showToast({
                message,
                title: t('salaryRules.viewError'),
                variant: 'error',
            });
        }
    }

    async function handleConfirmDeleteRule() {
        if (!ruleToDelete) return;

        setDeleting(true);
        setError('');

        try {
            await deleteSalaryRule(ruleToDelete.id);
            if (selected?.id === ruleToDelete.id) setSelected(null);
            const deletedName = ruleToDelete.name;
            setRuleToDelete(null);
            await loadSalaryRules();
            showToast({
                message: t('salaryRules.deleted').replace(
                    '{name}',
                    deletedName,
                ),
                title: t('common.success'),
                variant: 'success',
            });
        } catch (deleteError) {
            const message = t(getSalaryRuleErrorKey(deleteError));
            setError(message);
            showToast({
                message,
                title: t('salaryRules.deleteError'),
                variant: 'error',
            });
        } finally {
            setDeleting(false);
        }
    }

    function changeSort(field: SalaryRuleSortField) {
        if (sortBy === field) {
            setSortOrder((current) => (current === 'ASC' ? 'DESC' : 'ASC'));
        } else {
            setSortBy(field);
            setSortOrder('ASC');
        }
        setPage(1);
    }

    function sortLabel(field: SalaryRuleSortField) {
        if (sortBy !== field) return '';
        return sortOrder === 'ASC' ? ' ^' : ' v';
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
                            {t('salaryRules.title')}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {t('salaryRules.subtitle')}
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
                        {t('salaryRules.add')}
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
                    label={t('salaryRules.loading')}
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
                            placeholder={t('salaryRules.searchPlaceholder')}
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
                                onChange={(value) => {
                                    setStatusFilter(
                                        value as SalaryRuleStatusFilter,
                                    );
                                    setPage(1);
                                }}
                            />
                        </label>
                        <Button
                            className="max-sm:w-full"
                            onClick={() => void loadSalaryRules()}
                            size="lg"
                            variant="secondary"
                        >
                            <FontAwesomeIcon icon={faRotateRight} />
                            {t('common.refresh')}
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] table-fixed border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                {(
                                    [
                                        ['code', t('salaryRules.code')],
                                        ['name', t('salaryRules.name')],
                                        [
                                            'createdAt',
                                            t('salaryRules.currentMultiplier'),
                                        ],
                                        ['status', t('common.status')],
                                    ] as const
                                ).map(([field, label], index) => (
                                    <th
                                        className="px-5 py-3 text-center text-xs font-semibold text-slate-600"
                                        key={`${field}-${index}`}
                                    >
                                        {field === 'createdAt' ? (
                                            label
                                        ) : (
                                            <button
                                                className="min-h-0 cursor-pointer bg-transparent p-0 text-inherit hover:text-primary-600"
                                                onClick={() => changeSort(field)}
                                                type="button"
                                            >
                                                {label}
                                                {sortLabel(field)}
                                            </button>
                                        )}
                                    </th>
                                ))}
                                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-600">
                                    {t('common.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading &&
                                salaryRules.map((salaryRule) => (
                                    <tr
                                        className="border-b border-slate-100 transition hover:bg-slate-50/80 last:border-0"
                                        key={salaryRule.id}
                                    >
                                        <td className="px-5 py-3.5 text-center text-sm font-semibold text-slate-800">
                                            {salaryRule.code}
                                        </td>
                                        <td className="px-5 py-3.5 text-center text-sm text-slate-700">
                                            {salaryRule.name}
                                        </td>
                                        <td className="px-5 py-3.5 text-center text-sm font-semibold text-slate-800">
                                            {salaryRule.currentMultiplier ??
                                                t('salaryRules.noCurrentVersion')}
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                    salaryRule.status ===
                                                    SalaryRuleStatus.Active
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-amber-50 text-amber-700'
                                                }`}
                                            >
                                                <span
                                                    className={`size-1.5 rounded-full ${
                                                        salaryRule.status ===
                                                        SalaryRuleStatus.Active
                                                            ? 'bg-emerald-500'
                                                            : 'bg-amber-500'
                                                    }`}
                                                />
                                                {salaryRule.status ===
                                                SalaryRuleStatus.Active
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
                                                            salaryRule.id,
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
                                                                    salaryRule,
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
                                                            className="flex size-9 min-h-0 cursor-pointer items-center justify-center rounded-lg border border-red-100 bg-red-50 p-0 text-red-600 transition hover:border-red-300 hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                                            disabled={
                                                                salaryRule.isDefault
                                                            }
                                                            title={t(
                                                                'common.delete',
                                                            )}
                                                            type="button"
                                                            onClick={() =>
                                                                setRuleToDelete(
                                                                    salaryRule,
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
                            {!loading && salaryRules.length === 0 && (
                                <tr>
                                    <td colSpan={5}>
                                        <EmptyState
                                            description={t(
                                                'salaryRules.noResultsDescription',
                                            )}
                                            icon={<FontAwesomeIcon icon={faCoins} />}
                                            title={t('salaryRules.noResultsTitle')}
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
                <SalaryRuleFormDialog
                    editing={editing}
                    saving={saving}
                    onClose={() => setShowForm(false)}
                    onSubmit={handleSubmit}
                />
            )}

            {selected && (
                <SalaryRuleDetailsDialog
                    salaryRule={selected}
                    onClose={() => setSelected(null)}
                />
            )}

            <ConfirmDialog
                confirmLabel={t('salaryRules.deleteConfirmLabel')}
                description={t('salaryRules.deleteDescription').replace(
                    '{name}',
                    ruleToDelete?.name ?? '',
                )}
                loading={deleting}
                open={Boolean(ruleToDelete)}
                title={t('common.confirmDelete')}
                tone="danger"
                onCancel={() => setRuleToDelete(null)}
                onConfirm={() => void handleConfirmDeleteRule()}
            />

        </section>
    );
}
