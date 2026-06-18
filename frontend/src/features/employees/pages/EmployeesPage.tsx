import { useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEye,
    faFilter,
    faPen,
    faPlus,
    faRotateRight,
    faSearch,
    faTrash,
    faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog, useToast } from '@/components/feedback';
import {
    Button,
    EmptyState,
    LoadingOverlay,
    Pagination,
} from '@/components/ui';
import { roles, type Role } from '@/constants/roles';
import { routes } from '@/constants/routes';
import { listDepartments } from '@/features/departments/api/departments.api';
import { type Department } from '@/features/departments/types';
import { listPositions } from '@/features/positions/api/positions.api';
import { type Position } from '@/features/positions/types';
import { useDebounce } from '@/hooks/useDebounce';
import {
    createEmployee,
    deleteEmployee,
    getEmployeeErrorMessage,
    getMyEmployee,
    listEmployees,
    updateEmployee,
} from '../api/employees.api';
import { EmployeeFormDialog } from '../components/EmployeeFormDialog';
import {
    type Employee,
    type EmployeePayload,
    type EmployeeSortField,
    type EmployeeStatus,
    type SortOrder,
    type UpdateEmployeePayload,
} from '../types';

const pageSize = 10;
type StatusFilter = 'all' | EmployeeStatus;

type EmployeesPageProps = {
    userRole: Role;
};

const fieldClass =
    'min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100';

function fullName(employee: Employee) {
    return `${employee.firstName} ${employee.lastName}`;
}

export function EmployeesPage({ userRole }: EmployeesPageProps) {
    const canManage = userRole === roles.admin;
    const canList = userRole === roles.admin || userRole === roles.manager;
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [departmentId, setDepartmentId] = useState('');
    const [positionId, setPositionId] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [sortBy, setSortBy] = useState<EmployeeSortField>('createdAt');
    const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<Employee | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] =
        useState<Employee | null>(null);
    const [deleting, setDeleting] = useState(false);
    const debouncedSearch = useDebounce(search);

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
                departmentId: departmentId || undefined,
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
                message: getEmployeeErrorMessage(error),
                title: 'Could not load employees',
                variant: 'error',
            });
        } finally {
            setLoading(false);
        }
    }, [
        canList,
        debouncedSearch,
        departmentId,
        page,
        positionId,
        showToast,
        sortBy,
        sortOrder,
        statusFilter,
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
            listDepartments({
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
            .then(([departmentResponse, positionResponse]) => {
                if (!active) return;
                setDepartments(departmentResponse.data);
                setPositions(positionResponse.data);
            })
            .catch((error) => {
                showToast({
                    message: getEmployeeErrorMessage(error),
                    title: 'Could not load filters',
                    variant: 'error',
                });
            });

        return () => {
            active = false;
        };
    }, [canList, showToast]);

    function changeSort(field: EmployeeSortField) {
        if (sortBy === field) {
            setSortOrder((current) => (current === 'ASC' ? 'DESC' : 'ASC'));
        } else {
            setSortBy(field);
            setSortOrder('ASC');
        }
        setPage(1);
    }

    async function handleSave(
        payload: EmployeePayload | UpdateEmployeePayload,
    ) {
        if (editing) {
            await updateEmployee(editing.id, payload as UpdateEmployeePayload);
        } else {
            await createEmployee(payload as EmployeePayload);
        }

        const wasEditing = Boolean(editing);
        setShowForm(false);
        setEditing(null);
        await loadEmployees();
        showToast({
            message: wasEditing
                ? 'Employee updated successfully.'
                : 'Employee created successfully.',
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
                    'Employee removed. Records with related data are moved to Inactive.',
                variant: 'success',
            });
        } catch (error) {
            showToast({
                message: getEmployeeErrorMessage(error),
                title: 'Could not delete employee',
                variant: 'error',
            });
        } finally {
            setDeleting(false);
        }
    }

    const activeCount = employees.filter(
        (employee) => employee.status === 'Active',
    ).length;

    return (
        <section className="mx-auto grid max-w-[1440px] gap-5 p-6 max-sm:p-4">
            <div className="flex items-center justify-between gap-5 rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm max-sm:flex-col max-sm:items-stretch">
                <div className="flex items-center gap-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                        <FontAwesomeIcon icon={faUsers} />
                    </span>
                    <div>
                        <h2 className="text-xl font-bold text-slate-950">
                            Employees
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Manage employee profiles, departments, positions,
                            and status.
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
                        Add Employee
                    </Button>
                )}
            </div>

            {canList && (
                <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
                    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">Total</p>
                        <strong className="mt-1 block text-2xl text-slate-950">
                            {total}
                        </strong>
                    </article>
                    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">Active on page</p>
                        <strong className="mt-1 block text-2xl text-emerald-700">
                            {activeCount}
                        </strong>
                    </article>
                    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">Inactive on page</p>
                        <strong className="mt-1 block text-2xl text-amber-700">
                            {employees.length - activeCount}
                        </strong>
                    </article>
                </div>
            )}

            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <LoadingOverlay label="Loading employees..." visible={loading} />
                {canList && (
                    <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
                        <label className="relative min-w-64 flex-1">
                            <FontAwesomeIcon
                                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
                                icon={faSearch}
                            />
                            <input
                                className={`${fieldClass} w-full pl-9`}
                                placeholder="Search code, name, or email..."
                                value={search}
                                onChange={(event) => {
                                    setSearch(event.target.value);
                                    setPage(1);
                                }}
                            />
                        </label>
                        <label className="relative">
                            <FontAwesomeIcon
                                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
                                icon={faFilter}
                            />
                            <select
                                className={`${fieldClass} cursor-pointer pl-9`}
                                value={departmentId}
                                onChange={(event) => {
                                    setDepartmentId(event.target.value);
                                    setPage(1);
                                }}
                            >
                                <option value="">All departments</option>
                                {departments.map((department) => (
                                    <option key={department.id} value={department.id}>
                                        {department.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <select
                            className={`${fieldClass} cursor-pointer`}
                            value={positionId}
                            onChange={(event) => {
                                setPositionId(event.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="">All positions</option>
                            {positions.map((position) => (
                                <option key={position.id} value={position.id}>
                                    {position.name}
                                </option>
                            ))}
                        </select>
                        <select
                            className={`${fieldClass} cursor-pointer`}
                            value={statusFilter}
                            onChange={(event) => {
                                setStatusFilter(
                                    event.target.value as StatusFilter,
                                );
                                setPage(1);
                            }}
                        >
                            <option value="all">All statuses</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                        <Button
                            onClick={() => void loadEmployees()}
                            size="lg"
                            variant="secondary"
                        >
                            <FontAwesomeIcon icon={faRotateRight} />
                            Refresh
                        </Button>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] table-fixed">
                        <thead className="bg-slate-50">
                            <tr className="border-b border-slate-200">
                                <th className="w-[16%] px-4 py-3 text-center text-xs font-semibold text-slate-600">
                                    <button
                                        className="cursor-pointer hover:text-primary-600"
                                        onClick={() => changeSort('employeeCode')}
                                        type="button"
                                    >
                                        Code
                                    </button>
                                </th>
                                <th className="w-[26%] px-4 py-3 text-center text-xs font-semibold text-slate-600">
                                    <button
                                        className="cursor-pointer hover:text-primary-600"
                                        onClick={() => changeSort('fullName')}
                                        type="button"
                                    >
                                        Full Name
                                    </button>
                                </th>
                                <th className="w-[30%] px-4 py-3 text-center text-xs font-semibold text-slate-600">
                                    Email
                                </th>
                                <th className="w-[14%] px-4 py-3 text-center text-xs font-semibold text-slate-600">
                                    Status
                                </th>
                                <th className="w-[14%] px-4 py-3 text-center text-xs font-semibold text-slate-600">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading &&
                                employees.map((employee) => (
                                    <tr
                                        className="border-b border-slate-100 hover:bg-slate-50"
                                        key={employee.id}
                                    >
                                        <td className="px-4 py-3 text-center text-sm font-semibold text-slate-800">
                                            {employee.employeeCode}
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm text-slate-800">
                                            {fullName(employee)}
                                        </td>
                                        <td className="truncate px-4 py-3 text-center text-sm text-slate-600">
                                            {employee.email}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                    employee.status === 'Active'
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-amber-50 text-amber-700'
                                                }`}
                                            >
                                                {employee.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    aria-label="View employee"
                                                    className="flex size-9 min-h-0 cursor-pointer items-center justify-center rounded-lg border border-primary-100 bg-primary-50 p-0 text-primary-600 transition hover:border-primary-300 hover:bg-primary-600 hover:text-white"
                                                    onClick={() =>
                                                        navigate(
                                                            `${routes.employees}/${employee.id}`,
                                                        )
                                                    }
                                                    title="View employee"
                                                    type="button"
                                                >
                                                    <FontAwesomeIcon icon={faEye} />
                                                </button>
                                                {canManage && (
                                                    <>
                                                        <button
                                                            aria-label="Edit employee"
                                                            className="flex size-9 min-h-0 cursor-pointer items-center justify-center rounded-lg border border-blue-100 bg-blue-50 p-0 text-blue-600 transition hover:border-blue-300 hover:bg-blue-600 hover:text-white"
                                                            onClick={() => {
                                                                setEditing(employee);
                                                                setShowForm(true);
                                                            }}
                                                            title="Edit employee"
                                                            type="button"
                                                        >
                                                            <FontAwesomeIcon
                                                                icon={faPen}
                                                            />
                                                        </button>
                                                        <button
                                                            aria-label="Delete employee"
                                                            className="flex size-9 min-h-0 cursor-pointer items-center justify-center rounded-lg border border-red-100 bg-red-50 p-0 text-red-600 transition hover:border-red-300 hover:bg-red-600 hover:text-white"
                                                            onClick={() =>
                                                                setEmployeeToDelete(
                                                                    employee,
                                                                )
                                                            }
                                                            title="Delete employee"
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
                            {!loading && employees.length === 0 && (
                                <tr>
                                    <td colSpan={5}>
                                        <EmptyState
                                            description="Try changing the search or filters."
                                            icon={<FontAwesomeIcon icon={faUsers} />}
                                            title="No employees found"
                                        />
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {canList && (
                    <Pagination
                        page={page}
                        pageSize={pageSize}
                        totalPages={totalPages}
                        onPageChange={setPage}
                    />
                )}
            </div>

            {showForm && (
                <EmployeeFormDialog
                    departments={departments}
                    editing={editing}
                    positions={positions}
                    onClose={() => setShowForm(false)}
                    onSubmit={handleSave}
                />
            )}
            <ConfirmDialog
                confirmLabel="Delete employee"
                description={`Delete employee "${employeeToDelete ? fullName(employeeToDelete) : ''}"? If related data exists, the profile will be moved to Inactive.`}
                loading={deleting}
                open={Boolean(employeeToDelete)}
                title="Confirm delete"
                tone="danger"
                onCancel={() => setEmployeeToDelete(null)}
                onConfirm={() => void handleDelete()}
            />
        </section>
    );
}
