import { useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBuilding,
    faEye,
    faFilter,
    faPause,
    faPen,
    faPlus,
    faRotateRight,
    faSearch,
    faTrash,
    faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { ConfirmDialog, useToast } from '@/components/feedback';
import {
    Button,
    EmptyState,
    LoadingOverlay,
    Pagination,
} from '@/components/ui';
import { useDebounce } from '@/hooks/useDebounce';
import {
    createDepartment,
    deleteDepartment,
    getDepartment,
    getDepartmentErrorMessage,
    listDepartments,
    updateDepartment,
} from '../api/departments.api';
import { DepartmentDetailsDialog } from '../components/DepartmentDetailsDialog';
import { DepartmentFormDialog } from '../components/DepartmentFormDialog';
import {
    type Department,
    type DepartmentPayload,
    type DepartmentSortField,
    type SortOrder,
} from '../types';

const pageSize = 10;
type StatusFilter = 'all' | 'active' | 'inactive';

const fieldClass =
    'min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500';

function formatDate(value: string) {
    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(value));
}

export function DepartmentsPage() {
    const { showToast } = useToast();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const debouncedSearch = useDebounce(search);
    const [sortBy, setSortBy] =
        useState<DepartmentSortField>('createdAt');
    const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editing, setEditing] = useState<Department | null>(null);
    const [selected, setSelected] = useState<Department | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [departmentToDelete, setDepartmentToDelete] =
        useState<Department | null>(null);
    const [deleting, setDeleting] = useState(false);

    const loadDepartments = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const response = await listDepartments({
                page,
                limit: pageSize,
                search: debouncedSearch || undefined,
                sortBy,
                sortOrder,
            });
            setDepartments(response.data);
            setTotal(response.meta.total);
            setTotalPages(response.meta.totalPages);

            if (
                response.meta.totalPages > 0 &&
                page > response.meta.totalPages
            ) {
                setPage(response.meta.totalPages);
            }
        } catch (loadError) {
            setError(getDepartmentErrorMessage(loadError));
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, page, sortBy, sortOrder]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadDepartments();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [loadDepartments]);

    const activeCount = departments.filter(
        (department) => department.status,
    ).length;
    const inactiveCount = departments.length - activeCount;
    const displayedDepartments = departments.filter((department) => {
        if (statusFilter === 'active') {
            return department.status;
        }
        if (statusFilter === 'inactive') {
            return !department.status;
        }
        return true;
    });

    function openCreateForm() {
        setEditing(null);
        setShowForm(true);
    }

    function openEditForm(department: Department) {
        setEditing(department);
        setShowForm(true);
    }

    async function handleSubmit(form: DepartmentPayload) {
        if (editing) {
            await updateDepartment(editing.id, form);
        } else {
            await createDepartment(form);
        }

        const wasEditing = Boolean(editing);
        setShowForm(false);
        setEditing(null);
        await loadDepartments();
        showToast({
            message: wasEditing
                ? 'Đã cập nhật thông tin phòng ban.'
                : 'Đã tạo phòng ban mới.',
            title: wasEditing ? 'Cập nhật thành công' : 'Tạo thành công',
            variant: 'success',
        });
    }

    async function handleView(id: string) {
        setError('');

        try {
            setSelected(await getDepartment(id));
        } catch (viewError) {
            const message = getDepartmentErrorMessage(viewError);
            setError(message);
            showToast({
                message,
                title: 'Không thể xem chi tiết',
                variant: 'error',
            });
        }
    }

    async function handleConfirmDelete() {
        if (!departmentToDelete) {
            return;
        }

        setDeleting(true);
        setError('');

        try {
            await deleteDepartment(departmentToDelete.id);
            if (selected?.id === departmentToDelete.id) {
                setSelected(null);
            }
            const deletedDepartmentName = departmentToDelete.name;
            setDepartmentToDelete(null);
            await loadDepartments();
            showToast({
                message: `Đã xóa phòng ban "${deletedDepartmentName}".`,
                title: 'Xóa thành công',
                variant: 'success',
            });
        } catch (deleteError) {
            const message = getDepartmentErrorMessage(deleteError);
            setError(message);
            showToast({
                message,
                title: 'Không thể xóa phòng ban',
                variant: 'error',
            });
        } finally {
            setDeleting(false);
        }
    }

    function changeSort(field: DepartmentSortField) {
        if (sortBy === field) {
            setSortOrder((current) => (current === 'ASC' ? 'DESC' : 'ASC'));
        } else {
            setSortBy(field);
            setSortOrder('ASC');
        }
        setPage(1);
    }

    function sortLabel(field: DepartmentSortField) {
        if (sortBy !== field) {
            return '';
        }
        return sortOrder === 'ASC' ? ' ↑' : ' ↓';
    }

    const stats = [
        {
            label: 'Tổng phòng ban',
            value: total,
            note: 'Phòng ban trong hệ thống',
            icon: faUsers,
            color: 'bg-primary-50 text-primary-600',
        },
        {
            label: 'Đang hoạt động',
            value: activeCount,
            note: 'Trên trang hiện tại',
            icon: faPlus,
            color: 'bg-emerald-50 text-emerald-600',
        },
        {
            label: 'Tạm ngưng',
            value: inactiveCount,
            note: 'Trên trang hiện tại',
            icon: faPause,
            color: 'bg-amber-50 text-amber-500',
        },
        {
            label: 'Tổng nhân viên',
            value: 0,
            note: 'Chưa liên kết Employees',
            icon: faBuilding,
            color: 'bg-sky-50 text-sky-600',
        },
    ];

    return (
        <section className="mx-auto grid max-w-[1440px] gap-5 p-6 max-sm:p-4">
            <div className="flex items-center justify-between gap-5 rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm max-sm:items-stretch max-sm:flex-col">
                <div className="flex items-center gap-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xl text-primary-600">
                        <FontAwesomeIcon icon={faBuilding} />
                    </span>
                    <div>
                        <h2 className="text-xl font-bold text-slate-950">
                            Phòng ban
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Quản lý và tổ chức các phòng ban trong hệ thống.
                        </p>
                    </div>
                </div>
                <Button
                    className="shadow-sm"
                    onClick={openCreateForm}
                    size="lg"
                >
                    <FontAwesomeIcon icon={faPlus} />
                    Thêm phòng ban
                </Button>
            </div>

            <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1">
                {stats.map((stat) => (
                    <article
                        className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                        key={stat.label}
                    >
                        <span
                            className={`flex size-12 shrink-0 items-center justify-center rounded-full text-lg ${stat.color}`}
                        >
                            <FontAwesomeIcon icon={stat.icon} />
                        </span>
                        <div>
                            <p className="text-sm text-slate-500">
                                {stat.label}
                            </p>
                            <strong className="mt-1 block text-2xl text-slate-950">
                                {stat.value}
                            </strong>
                            <p className="mt-1 text-xs text-slate-400">
                                {stat.note}
                            </p>
                        </div>
                    </article>
                ))}
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <LoadingOverlay
                    label="Đang tải phòng ban..."
                    visible={loading}
                />
                <div className="flex items-center justify-between gap-4 border-b border-slate-200 p-4 max-md:items-stretch max-md:flex-col">
                    <label className="relative block w-full max-w-sm">
                        <span className="sr-only">Tìm kiếm phòng ban</span>
                        <FontAwesomeIcon
                            className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400"
                            icon={faSearch}
                        />
                        <input
                            aria-label="Tìm kiếm phòng ban"
                            className={`${fieldClass} pl-9`}
                            placeholder="Tìm theo mã hoặc tên phòng ban..."
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                        />
                    </label>

                    <div className="flex items-center gap-3 max-sm:flex-col">
                        <label className="relative">
                            <span className="sr-only">Lọc trạng thái</span>
                            <FontAwesomeIcon
                                className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-500"
                                icon={faFilter}
                            />
                            <select
                                className="min-h-11 cursor-pointer rounded-lg border border-slate-200 bg-white pr-9 pl-9 text-sm font-medium text-slate-700 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 max-sm:w-full"
                                value={statusFilter}
                                onChange={(event) =>
                                    setStatusFilter(
                                        event.target.value as StatusFilter,
                                    )
                                }
                            >
                                <option value="all">Trạng thái: Tất cả</option>
                                <option value="active">Hoạt động</option>
                                <option value="inactive">Tạm ngưng</option>
                            </select>
                        </label>
                        <Button
                            className="max-sm:w-full"
                            onClick={() => void loadDepartments()}
                            size="lg"
                            variant="secondary"
                        >
                            <FontAwesomeIcon icon={faRotateRight} />
                            Làm mới
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[820px] table-fixed border-collapse">
                        <colgroup>
                            <col className="w-[16%]" />
                            <col className="w-[26%]" />
                            <col className="w-[18%]" />
                            <col className="w-[20%]" />
                            <col className="w-[20%]" />
                        </colgroup>
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                {(
                                    [
                                        ['code', 'Mã Phòng ban'],
                                        ['name', 'Tên phòng ban'],
                                        ['status', 'Trạng thái'],
                                        ['createdAt', 'Ngày tạo'],
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
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading &&
                                displayedDepartments.map((department) => (
                                    <tr
                                        className="border-b border-slate-100 transition hover:bg-slate-50/80 last:border-0"
                                        key={department.id}
                                    >
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center justify-center gap-3">
                                                <strong className="text-sm text-slate-800">
                                                    {department.code}
                                                </strong>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-center text-sm text-slate-700">
                                            {department.name}
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${department.status
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : 'bg-amber-50 text-amber-700'
                                                    }`}
                                            >
                                                <span
                                                    className={`size-1.5 rounded-full ${department.status
                                                        ? 'bg-emerald-500'
                                                        : 'bg-amber-500'
                                                        }`}
                                                />
                                                {department.status
                                                    ? 'Hoạt động'
                                                    : 'Tạm ngưng'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-center text-sm text-slate-600">
                                            {formatDate(department.createdAt)}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    aria-label={`Xem ${department.name}`}
                                                    className="flex size-9 min-h-0 cursor-pointer items-center justify-center rounded-lg border border-primary-100 bg-primary-50 p-0 text-primary-600 transition hover:border-primary-300 hover:bg-primary-600 hover:text-white"
                                                    onClick={() =>
                                                        void handleView(
                                                            department.id,
                                                        )
                                                    }
                                                    title="Xem chi tiết"
                                                    type="button"
                                                >
                                                    <FontAwesomeIcon
                                                        icon={faEye}
                                                    />
                                                </button>
                                                <button
                                                    aria-label={`Sửa ${department.name}`}
                                                    className="flex size-9 min-h-0 cursor-pointer items-center justify-center rounded-lg border border-blue-100 bg-blue-50 p-0 text-blue-600 transition hover:border-blue-300 hover:bg-blue-600 hover:text-white"
                                                    onClick={() =>
                                                        openEditForm(department)
                                                    }
                                                    title="Chỉnh sửa"
                                                    type="button"
                                                >
                                                    <FontAwesomeIcon
                                                        icon={faPen}
                                                    />
                                                </button>
                                                <button
                                                    aria-label={`Xóa ${department.name}`}
                                                    className="flex size-9 min-h-0 cursor-pointer items-center justify-center rounded-lg border border-red-100 bg-red-50 p-0 text-red-600 transition hover:border-red-300 hover:bg-red-600 hover:text-white"
                                                    onClick={() =>
                                                        setDepartmentToDelete(
                                                            department,
                                                        )
                                                    }
                                                    title="Xóa"
                                                    type="button"
                                                >
                                                    <FontAwesomeIcon
                                                        icon={faTrash}
                                                    />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            {!loading && displayedDepartments.length === 0 && (
                                <tr>
                                    <td colSpan={5}>
                                        <EmptyState
                                            description="Thử thay đổi từ khóa hoặc bộ lọc trạng thái."
                                            icon={
                                                <FontAwesomeIcon
                                                    icon={faBuilding}
                                                />
                                            }
                                            title="Chưa có phòng ban phù hợp"
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
                <DepartmentFormDialog
                    editing={editing}
                    onClose={() => setShowForm(false)}
                    onSubmit={handleSubmit}
                />
            )}

            {selected && (
                <DepartmentDetailsDialog
                    department={selected}
                    onClose={() => setSelected(null)}
                />
            )}

            <ConfirmDialog
                confirmLabel="Xóa phòng ban"
                description={`Bạn có chắc muốn xóa phòng ban "${departmentToDelete?.name ?? ''}"? Hành động này không thể hoàn tác.`}
                loading={deleting}
                open={Boolean(departmentToDelete)}
                title="Xác nhận xóa"
                tone="danger"
                onCancel={() => setDepartmentToDelete(null)}
                onConfirm={() => void handleConfirmDelete()}
            />
        </section>
    );
}
