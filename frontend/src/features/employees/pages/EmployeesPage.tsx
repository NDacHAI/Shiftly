import { useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowDown,
    faArrowUp,
    faChevronLeft,
    faChevronRight,
    faPlus,
    faSearch,
    faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog, useToast } from '@/components/feedback';
import { DropdownSelect } from '@/components/ui';
import { useSlidingIndicator } from '@/components/layout/useSlidingIndicator';
import { roles, type Role } from '@/constants/roles';
import { routes } from '@/constants/routes';
import { useI18n } from '@/i18n';
import { listBranches } from '@/features/branches/api/branches.api';
import { type Branch } from '@/features/branches/types';
import { initialsOf, interpolate } from '@/features/dashboard/lib/format';
import { listPositions } from '@/features/positions/api/positions.api';
import { type Position } from '@/features/positions/types';
import { useDebounce } from '@/hooks/useDebounce';
import {
    createEmployeeAccount,
    createEmployee,
    deleteEmployee,
    getEmployeeErrorKey,
    getMyEmployee,
    listEmployees,
} from '../api/employees.api';
import {
    EmployeeAddDrawer,
    type EmployeeAddSubmit,
} from '../components/EmployeeAddDrawer';
import { EmployeeStatusPill } from '../components/EmployeeStatusPill';
import {
    employeeFullName,
    formatDateDmy,
    primaryButtonClass,
} from '../lib/employee-ui';
import {
    type Employee,
    type EmployeeSortField,
    type EmployeeStatus,
    type SortOrder,
} from '../types';

const pageSize = 10;
type StatusFilter = 'all' | EmployeeStatus;

const statusFilters: Array<{ value: StatusFilter; labelKey: 'employees.statusAll' | 'common.active' | 'common.inactive' }> = [
    { value: 'all', labelKey: 'employees.statusAll' },
    { value: 'Active', labelKey: 'common.active' },
    { value: 'Inactive', labelKey: 'common.inactive' },
];

const rowGridClass =
    'grid grid-cols-[96px_minmax(220px,2fr)_minmax(120px,1.2fr)_minmax(110px,1fr)_110px_120px_56px] items-center gap-3 px-5';

const pagerButtonClass =
    'grid size-8 min-h-0 cursor-pointer place-items-center rounded-md border border-rule-strong bg-transparent text-xs text-ink transition-colors hover:bg-stone-soft disabled:cursor-default disabled:text-[#b9b3a4] disabled:hover:bg-transparent';

type EmployeesPageProps = {
    userRole: Role;
};

export function EmployeesPage({ userRole }: EmployeesPageProps) {
    const { language, t } = useI18n();
    const canManage = userRole === roles.admin;
    const canList = userRole === roles.admin || userRole === roles.manager;
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [branchId, setBranchId] = useState('');
    const [positionId, setPositionId] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [sortBy, setSortBy] = useState<EmployeeSortField>('createdAt');
    const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');
    const [loading, setLoading] = useState(true);
    const [loaded, setLoaded] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] =
        useState<Employee | null>(null);
    const [deleting, setDeleting] = useState(false);
    const debouncedSearch = useDebounce(search);
    const { containerRef: statusRef, indicatorRef: statusPillRef } =
        useSlidingIndicator<HTMLDivElement>('employee-status', `${statusFilter}|${language}`);

    const loadEmployees = useCallback(async () => {
        setLoading(true);

        try {
            if (!canList) {
                const employee = await getMyEmployee();
                setEmployees([employee]);
                setTotal(1);
                setTotalPages(1);
                return;
            }

            const response = await listEmployees({
                page,
                limit: pageSize,
                search: debouncedSearch || undefined,
                branchId: branchId || undefined,
                positionId: positionId || undefined,
                status:
                    statusFilter === 'all' ? undefined : statusFilter,
                sortBy,
                sortOrder,
            });
            setEmployees(response.data);
            setTotal(response.meta.total);
            setTotalPages(response.meta.totalPages);
        } catch (error) {
            showToast({
                message: t(getEmployeeErrorKey(error)),
                title: t('employees.loadError'),
                variant: 'error',
            });
        } finally {
            setLoading(false);
            setLoaded(true);
        }
    }, [
        canList,
        debouncedSearch,
        branchId,
        page,
        positionId,
        showToast,
        sortBy,
        sortOrder,
        statusFilter,
        t,
    ]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadEmployees();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [loadEmployees]);

    useEffect(() => {
        if (!canList) return;

        let active = true;

        void Promise.all([
            listBranches({
                page: 1,
                limit: 100,
                sortBy: 'name',
                sortOrder: 'ASC',
            }),
            listPositions({
                page: 1,
                limit: 100,
                sortBy: 'name',
                sortOrder: 'ASC',
            }),
        ])
            .then(([BranchResponse, positionResponse]) => {
                if (!active) return;
                setBranches(BranchResponse.data);
                setPositions(positionResponse.data);
            })
            .catch((error) => {
                showToast({
                    message: t(getEmployeeErrorKey(error)),
                    title: t('employees.filtersLoadError'),
                    variant: 'error',
                });
            });

        return () => {
            active = false;
        };
    }, [canList, showToast, t]);

    function changeSort(field: EmployeeSortField) {
        if (sortBy === field) {
            setSortOrder((current) => (current === 'ASC' ? 'DESC' : 'ASC'));
        } else {
            setSortBy(field);
            setSortOrder('ASC');
        }
        setPage(1);
    }

    async function handleSave(payload: EmployeeAddSubmit) {
        const employee = await createEmployee(payload.employee);

        if (payload.account) {
            await createEmployeeAccount(employee.id, payload.account);
        }

        await loadEmployees();
        showToast({
            message: interpolate(t('employees.createdWithCode'), {
                name: employeeFullName(employee),
                code: employee.employeeCode,
            }),
            variant: 'success',
        });
    }

    async function handleDelete() {
        if (!employeeToDelete) return;
        setDeleting(true);

        try {
            await deleteEmployee(employeeToDelete.id);
            setEmployeeToDelete(null);
            await loadEmployees();
            showToast({
                message:
                    t('employees.deleted'),
                variant: 'success',
            });
        } catch (error) {
            showToast({
                message: t(getEmployeeErrorKey(error)),
                title: t('employees.deleteError'),
                variant: 'error',
            });
        } finally {
            setDeleting(false);
        }
    }

    function renderSortHeader(field: EmployeeSortField, label: string) {
        const active = sortBy === field;

        return (
            <button
                className={`flex min-h-0 cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-left text-xs transition-colors hover:text-ink ${
                    active ? 'text-ink' : 'text-muted'
                }`}
                type="button"
                onClick={() => changeSort(field)}
            >
                {label}
                {active && (
                    <FontAwesomeIcon
                        className="text-[10px]"
                        icon={sortOrder === 'ASC' ? faArrowUp : faArrowDown}
                    />
                )}
            </button>
        );
    }

    const displayedPage = totalPages === 0 ? 0 : page;

    return (
        <section className="bg-sand text-ink">
            <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5 px-8 pt-8 pb-24 max-sm:px-4">
                <div className="flex flex-wrap items-end justify-between gap-5">
                    <div className="flex flex-col gap-1.5">
                        <span className="tabular-nums text-xs tracking-[0.04em] text-muted uppercase">
                            {t('employees.eyebrow')}
                        </span>
                        <h1 className="text-[34px] leading-tight font-semibold tracking-[-0.03em] max-sm:text-[28px]">
                            {t('employees.title')}
                        </h1>
                        <p className="text-[15px] text-muted">
                            {t('employees.subtitle')}
                        </p>
                    </div>
                    {canManage && (
                        <button
                            className={primaryButtonClass}
                            type="button"
                            onClick={() => setShowForm(true)}
                        >
                            <FontAwesomeIcon icon={faPlus} />
                            {t('employees.add')}
                        </button>
                    )}
                </div>

                <section className="flex flex-col overflow-hidden rounded-[14px] border border-rule bg-paper">
                    {canList && (
                        <div className="flex flex-wrap items-center gap-2.5 border-b border-rule px-5 py-4 max-sm:px-4">
                            <label className="flex h-[38px] min-w-[200px] flex-[0_1_360px] items-center gap-2.5 rounded-lg border border-rule-strong bg-white px-3 transition-colors focus-within:border-ink">
                                <FontAwesomeIcon
                                    className="text-xs text-muted"
                                    icon={faSearch}
                                />
                                <input
                                    aria-label={t('common.search')}
                                    className="min-w-0 flex-1 border-0 bg-transparent text-[13px] text-ink outline-none placeholder:text-faint"
                                    placeholder={t('employees.searchPlaceholder')}
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
                                    { value: '', label: t('common.allBranches') },
                                    ...branches.map((branch) => ({
                                        value: branch.id,
                                        label: branch.name,
                                    })),
                                ]}
                                size="xs"
                                value={branchId}
                                onChange={(value) => {
                                    setBranchId(value);
                                    setPage(1);
                                }}
                            />
                            <DropdownSelect
                                ariaLabel={t('common.position')}
                                options={[
                                    { value: '', label: t('common.allPositions') },
                                    ...positions.map((position) => ({
                                        value: position.id,
                                        label: position.name,
                                    })),
                                ]}
                                size="xs"
                                value={positionId}
                                onChange={(value) => {
                                    setPositionId(value);
                                    setPage(1);
                                }}
                            />
                            <div className="flex-1" />
                            <div
                                aria-label={t('common.status')}
                                className="relative flex gap-0.5 rounded-lg bg-stone p-[3px]"
                                ref={statusRef}
                                role="group"
                            >
                                <span
                                    aria-hidden="true"
                                    className="pointer-events-none absolute inset-y-[3px] left-0 rounded-md bg-paper opacity-0 shadow-[0_1px_2px_rgba(23,22,15,0.12)] transition-[transform,width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
                                    ref={statusPillRef}
                                />
                                {statusFilters.map((filter) => {
                                    const active = statusFilter === filter.value;

                                    return (
                                        <button
                                            aria-pressed={active}
                                            className={`relative h-8 min-h-0 cursor-pointer rounded-md border-0 bg-transparent px-3 text-[13px] font-medium whitespace-nowrap transition-colors duration-200 ${
                                                active ? 'text-ink' : 'text-muted hover:text-ink'
                                            }`}
                                            data-active={active}
                                            key={filter.value}
                                            type="button"
                                            onClick={() => {
                                                setStatusFilter(filter.value);
                                                setPage(1);
                                            }}
                                        >
                                            {t(filter.labelKey)}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <div className="min-w-[880px]">
                            <div
                                className={`${rowGridClass} border-b border-rule py-2.5 text-xs text-muted`}
                            >
                                {renderSortHeader('employeeCode', t('common.code'))}
                                {renderSortHeader('fullName', t('employees.employeeColumn'))}
                                <span>{t('common.branches')}</span>
                                <span>{t('common.position')}</span>
                                <span>{t('employees.hireDate')}</span>
                                <span>{t('common.status')}</span>
                                <span />
                            </div>

                            {!loaded && (
                                <div aria-busy="true" aria-label={t('employees.loading')}>
                                    {Array.from({ length: 4 }, (_, index) => (
                                        <div
                                            className={`${rowGridClass} h-16 border-b border-rule-soft`}
                                            key={index}
                                        >
                                            <span className="h-3 w-16 animate-pulse rounded bg-stone" />
                                            <span className="flex items-center gap-3">
                                                <span className="size-[34px] animate-pulse rounded-full bg-stone" />
                                                <span className="h-3 w-40 animate-pulse rounded bg-stone" />
                                            </span>
                                            <span className="h-3 w-20 animate-pulse rounded bg-stone" />
                                            <span className="h-3 w-16 animate-pulse rounded bg-stone" />
                                            <span className="h-3 w-16 animate-pulse rounded bg-stone" />
                                            <span className="h-5 w-20 animate-pulse rounded-full bg-stone" />
                                            <span />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {loaded && (
                                <div
                                    className={`transition-opacity duration-200 ${
                                        loading ? 'opacity-50' : 'opacity-100'
                                    }`}
                                >
                                    {employees.map((employee) => {
                                        const name = employeeFullName(employee);

                                        return (
                                            <div
                                                className={`${rowGridClass} group h-16 cursor-pointer border-b border-rule-soft text-sm transition-colors hover:bg-[#f6f4ef]`}
                                                key={employee.id}
                                                role="link"
                                                tabIndex={0}
                                                onClick={() =>
                                                    navigate(`${routes.employees}/${employee.id}`)
                                                }
                                                onKeyDown={(event) => {
                                                    if (event.key === 'Enter') {
                                                        navigate(`${routes.employees}/${employee.id}`);
                                                    }
                                                }}
                                            >
                                                <span className="tabular-nums text-[13px] font-medium">
                                                    {employee.employeeCode}
                                                </span>
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <span className="grid size-[34px] flex-none place-items-center rounded-full bg-stone text-xs font-semibold">
                                                        {initialsOf(name)}
                                                    </span>
                                                    <span className="flex min-w-0 flex-col gap-0.5">
                                                        <span className="truncate font-semibold">
                                                            {name}
                                                        </span>
                                                        <span className="truncate text-xs text-muted">
                                                            {employee.email}
                                                        </span>
                                                    </span>
                                                </div>
                                                <span className="truncate text-[13px]">
                                                    {employee.branches.map((branch) => branch.name).join(', ') || '—'}
                                                </span>
                                                <span className="truncate text-[13px]">
                                                    {employee.positions.map((position) => position.name).join(', ') || '—'}
                                                </span>
                                                <span className="tabular-nums text-xs text-muted">
                                                    {formatDateDmy(employee.hireDate)}
                                                </span>
                                                <span className="flex">
                                                    <EmployeeStatusPill status={employee.status} />
                                                </span>
                                                <span className="flex items-center justify-end gap-1">
                                                    {canManage && (
                                                        <button
                                                            aria-label={t('common.delete')}
                                                            className="grid size-7 min-h-0 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-xs text-muted opacity-0 transition-[opacity,background-color,color] group-hover:opacity-100 hover:bg-ember-tint hover:text-ember-strong focus-visible:opacity-100"
                                                            title={t('common.delete')}
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                setEmployeeToDelete(employee);
                                                            }}
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} />
                                                        </button>
                                                    )}
                                                    <span className="text-base text-faint transition-transform duration-200 group-hover:translate-x-0.5">
                                                        ›
                                                    </span>
                                                </span>
                                            </div>
                                        );
                                    })}

                                    {employees.length === 0 && (
                                        <div className="flex flex-col gap-1.5 border-b border-rule-soft px-5 py-14 text-center">
                                            <span className="text-[15px] font-semibold">
                                                {t('employees.noResultsTitle')}
                                            </span>
                                            <span className="text-[13px] text-muted">
                                                {t('employees.noResultsDescription')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {canList && (
                        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 max-sm:px-4">
                            <span className="text-[13px] text-muted">
                                {interpolate(t('employees.countLabel'), {
                                    shown: employees.length,
                                    total,
                                    size: pageSize,
                                })}
                            </span>
                            <div className="flex items-center gap-1.5">
                                <button
                                    aria-label={t('employees.previousPage')}
                                    className={pagerButtonClass}
                                    disabled={page <= 1 || totalPages === 0}
                                    type="button"
                                    onClick={() => setPage(page - 1)}
                                >
                                    <FontAwesomeIcon icon={faChevronLeft} />
                                </button>
                                <span className="grid size-8 place-items-center rounded-md bg-ink text-[13px] font-semibold text-sand">
                                    {displayedPage}
                                </span>
                                <button
                                    aria-label={t('employees.nextPage')}
                                    className={pagerButtonClass}
                                    disabled={page >= totalPages || totalPages === 0}
                                    type="button"
                                    onClick={() => setPage(page + 1)}
                                >
                                    <FontAwesomeIcon icon={faChevronRight} />
                                </button>
                                <span className="pl-2 tabular-nums text-xs text-muted">
                                    {interpolate(t('employees.pageInfo'), {
                                        page: displayedPage,
                                        total: totalPages,
                                    })}
                                </span>
                            </div>
                        </div>
                    )}
                </section>
            </div>

            {showForm && (
                <EmployeeAddDrawer
                    branches={branches}
                    positions={positions}
                    onClose={() => setShowForm(false)}
                    onSubmit={handleSave}
                />
            )}
            <ConfirmDialog
                cancelLabel={t('common.cancel')}
                confirmLabel={t('employees.deleteConfirmLabel')}
                description={interpolate(t('employees.deleteDescription'), {
                    name: employeeToDelete ? employeeFullName(employeeToDelete) : '',
                })}
                loading={deleting}
                open={Boolean(employeeToDelete)}
                title={t('common.confirmDelete')}
                tone="danger"
                onCancel={() => setEmployeeToDelete(null)}
                onConfirm={() => void handleDelete()}
            />
        </section>
    );
}
