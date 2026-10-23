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
                        {t('salaryRules.add')}
                    </Button>
                )}
                description={t('salaryRules.subtitle')}
                icon={<FontAwesomeIcon icon={faCoins} />}
                title={t('salaryRules.title')}
            />

            {error && (
                <div className="rounded-lg border border-[#efc4b9] bg-[#f6dcd6] px-4 py-3 text-sm text-[#9a2f1f]">
                    {error}
                </div>
            )}

            <div className="relative overflow-hidden rounded-[14px] border border-rule bg-paper">
                <LoadingOverlay
                    label={t('salaryRules.loading')}
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
                    <table className="data-table w-full min-w-[980px] table-fixed border-collapse">
                        <thead>
                            <tr>
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
                                        key={`${field}-${index}`}
                                    >
                                        {field === 'createdAt' ? (
                                            label
                                        ) : (
                                            <button
                                                className="min-h-0 cursor-pointer bg-transparent p-0 text-inherit hover:text-ink"
                                                onClick={() => changeSort(field)}
                                                type="button"
                                            >
                                                {label}
                                                {sortLabel(field)}
                                            </button>
                                        )}
                                    </th>
                                ))}
                                <th className="cell-actions">
                                    {t('common.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading &&
                                salaryRules.map((salaryRule) => (
                                    <tr
                                        className="border-b border-rule-soft transition hover:bg-[#f6f4ef] last:border-0"
                                        key={salaryRule.id}
                                    >
                                        <td className="font-semibold text-ink">
                                            {salaryRule.code}
                                        </td>
                                        <td>
                                            {salaryRule.name}
                                        </td>
                                        <td className="font-semibold text-ink">
                                            {salaryRule.currentMultiplier ??
                                                t('salaryRules.noCurrentVersion')}
                                        </td>
                                        <td>
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-full px-[9px] py-[3px] text-xs font-semibold whitespace-nowrap ${
                                                    salaryRule.status ===
                                                    SalaryRuleStatus.Active
                                                        ? 'bg-[#dff0e4] text-[#1f6237]'
                                                        : 'bg-ember-tint text-ember-ink'
                                                }`}
                                            >
                                                <span
                                                    className={`size-1.5 rounded-full ${
                                                        salaryRule.status ===
                                                        SalaryRuleStatus.Active
                                                            ? 'bg-live'
                                                            : 'bg-ember'
                                                    }`}
                                                />
                                                {salaryRule.status ===
                                                SalaryRuleStatus.Active
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
                                                            salaryRule.id,
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
                                                                    salaryRule,
                                                                );
                                                                setShowForm(true);
                                                            }}
                                                            tone="primary"
                                                        />
                                                        <IconButton
                                                            disabled={
                                                                salaryRule.isDefault
                                                            }
                                                            icon={faTrash}
                                                            label={t(
                                                                'common.delete',
                                                            )}
                                                            onClick={() =>
                                                                setRuleToDelete(
                                                                    salaryRule,
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
