import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBuilding,
    faChevronLeft,
    faChevronRight,
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
import { useDebounce } from '@/hooks/useDebounce';
import {
    createDepartment,
    deleteDepartment,
    getDepartment,
    getDepartmentErrorMessage,
    listDepartments,
    updateDepartment,
} from '../api/departments.api';
import {
    type Department,
    type DepartmentPayload,
    type DepartmentSortField,
    type SortOrder,
} from '../types';

const pageSize = 10;
const initialForm: DepartmentPayload = {
    code: '',
    name: '',
    description: '',
    status: true,
};

type StatusFilter = 'all' | 'active' | 'inactive';

const fieldClass =
    'min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:bg-slate-100 disabled:text-slate-500';

function formatDate(value: string) {
    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(value));
}

export function DepartmentsPage() {
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
    const [form, setForm] = useState<DepartmentPayload>(initialForm);
    const [editing, setEditing] = useState<Department | null>(null);
    const [selected, setSelected] = useState<Department | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);

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
        setForm(initialForm);
        setError('');
        setShowForm(true);
    }

    function openEditForm(department: Department) {
        setEditing(department);
        setForm({
            code: department.code,
            name: department.name,
            description: department.description ?? '',
            status: department.status,
        });
        setError('');
        setShowForm(true);
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        setError('');

        try {
            if (editing) {
                await updateDepartment(editing.id, {
                    name: form.name,
                    description: form.description,
                    status: form.status,
                });
            } else {
                await createDepartment(form);
            }

            setShowForm(false);
            setEditing(null);
            setForm(initialForm);
            await loadDepartments();
        } catch (saveError) {
            setError(getDepartmentErrorMessage(saveError));
        } finally {
            setSaving(false);
        }
    }

    async function handleView(id: string) {
        setError('');

        try {
            setSelected(await getDepartment(id));
        } catch (viewError) {
            setError(getDepartmentErrorMessage(viewError));
        }
    }

    async function handleDelete(department: Department) {
        if (!window.confirm(`Xóa phòng ban "${department.name}"?`)) {
            return;
        }

        setError('');

        try {
            await deleteDepartment(department.id);
            if (selected?.id === department.id) {
                setSelected(null);
            }
            await loadDepartments();
        } catch (deleteError) {
            setError(getDepartmentErrorMessage(deleteError));
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
            color: 'bg-violet-50 text-violet-600',
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
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-violet-50 text-xl text-violet-600">
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
                <button
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
                    onClick={openCreateForm}
                    type="button"
                >
                    <FontAwesomeIcon icon={faPlus} />
                    Thêm phòng ban
                </button>
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

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
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
                                className="min-h-11 rounded-lg border border-slate-200 bg-white pr-9 pl-9 text-sm font-medium text-slate-700 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 max-sm:w-full"
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
                        <button
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 max-sm:w-full"
                            onClick={() => void loadDepartments()}
                            type="button"
                        >
                            <FontAwesomeIcon icon={faRotateRight} />
                            Làm mới
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[820px] border-collapse text-left">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                {(
                                    [
                                        ['code', 'Mã'],
                                        ['name', 'Tên phòng ban'],
                                        ['status', 'Trạng thái'],
                                        ['createdAt', 'Ngày tạo'],
                                    ] as const
                                ).map(([field, label]) => (
                                    <th
                                        className="px-5 py-3 text-xs font-semibold text-slate-600"
                                        key={field}
                                    >
                                        <button
                                            className="min-h-0 bg-transparent p-0 text-inherit hover:text-violet-600"
                                            onClick={() => changeSort(field)}
                                            type="button"
                                        >
                                            {label}
                                            {sortLabel(field)}
                                        </button>
                                    </th>
                                ))}
                                <th className="px-5 py-3 text-xs font-semibold text-slate-600">
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
                                            <div className="flex items-center gap-3">
                                                <span className="flex size-8 items-center justify-center rounded-full bg-violet-50 text-[11px] font-bold text-violet-600">
                                                    {department.code
                                                        .slice(0, 2)
                                                        .toUpperCase()}
                                                </span>
                                                <strong className="text-sm text-slate-800">
                                                    {department.code}
                                                </strong>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-slate-700">
                                            {department.name}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                    department.status
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-amber-50 text-amber-700'
                                                }`}
                                            >
                                                <span
                                                    className={`size-1.5 rounded-full ${
                                                        department.status
                                                            ? 'bg-emerald-500'
                                                            : 'bg-amber-500'
                                                    }`}
                                                />
                                                {department.status
                                                    ? 'Hoạt động'
                                                    : 'Tạm ngưng'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-slate-600">
                                            {formatDate(department.createdAt)}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    aria-label={`Xem ${department.name}`}
                                                    className="flex size-9 min-h-0 items-center justify-center rounded-lg border border-violet-100 bg-violet-50 p-0 text-violet-600 transition hover:border-violet-300 hover:bg-violet-600 hover:text-white"
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
                                                    className="flex size-9 min-h-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 p-0 text-blue-600 transition hover:border-blue-300 hover:bg-blue-600 hover:text-white"
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
                                                    className="flex size-9 min-h-0 items-center justify-center rounded-lg border border-red-100 bg-red-50 p-0 text-red-600 transition hover:border-red-300 hover:bg-red-600 hover:text-white"
                                                    onClick={() =>
                                                        void handleDelete(
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
                                    <td
                                        className="px-5 py-12 text-center text-sm text-slate-500"
                                        colSpan={5}
                                    >
                                        Chưa có phòng ban phù hợp.
                                    </td>
                                </tr>
                            )}
                            {loading && (
                                <tr>
                                    <td
                                        className="px-5 py-12 text-center text-sm text-slate-500"
                                        colSpan={5}
                                    >
                                        Đang tải...
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-slate-200 px-5 py-4 text-sm text-slate-500 max-sm:flex-col">
                    <span>Hiển thị {pageSize} trên mỗi trang</span>
                    <div className="flex items-center gap-2">
                        <button
                            aria-label="Trang trước"
                            className="flex size-9 min-h-0 items-center justify-center rounded-lg border border-slate-200 bg-white p-0 text-slate-500 transition hover:border-violet-200 hover:text-violet-600 disabled:opacity-40"
                            disabled={page <= 1}
                            onClick={() => setPage((current) => current - 1)}
                            type="button"
                        >
                            <FontAwesomeIcon icon={faChevronLeft} />
                        </button>
                        <span className="flex size-9 items-center justify-center rounded-lg bg-violet-600 font-semibold text-white">
                            {totalPages === 0 ? 0 : page}
                        </span>
                        <button
                            aria-label="Trang sau"
                            className="flex size-9 min-h-0 items-center justify-center rounded-lg border border-slate-200 bg-white p-0 text-slate-500 transition hover:border-violet-200 hover:text-violet-600 disabled:opacity-40"
                            disabled={page >= totalPages}
                            onClick={() => setPage((current) => current + 1)}
                            type="button"
                        >
                            <FontAwesomeIcon icon={faChevronRight} />
                        </button>
                        <span className="ml-3">
                            Trang {totalPages === 0 ? 0 : page} / {totalPages}
                        </span>
                    </div>
                </div>
            </div>

            {showForm && (
                <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/55 p-5">
                    <div
                        aria-modal="true"
                        className="max-h-[calc(100vh-40px)] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl"
                        role="dialog"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <h2 className="text-xl font-bold text-slate-950">
                                {editing
                                    ? 'Cập nhật phòng ban'
                                    : 'Tạo phòng ban'}
                            </h2>
                            <button
                                className="min-h-9 rounded-lg bg-slate-100 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                                onClick={() => setShowForm(false)}
                                type="button"
                            >
                                Đóng
                            </button>
                        </div>
                        <form
                            className="mt-6 grid gap-4"
                            onSubmit={handleSubmit}
                        >
                            {error && (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {error}
                                </div>
                            )}
                            <label className="grid gap-2 text-sm font-semibold text-slate-700">
                                Mã phòng ban
                                <input
                                    className={fieldClass}
                                    disabled={Boolean(editing)}
                                    maxLength={20}
                                    required
                                    value={form.code}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            code: event.target.value,
                                        }))
                                    }
                                />
                            </label>
                            <label className="grid gap-2 text-sm font-semibold text-slate-700">
                                Tên phòng ban
                                <input
                                    className={fieldClass}
                                    maxLength={100}
                                    required
                                    value={form.name}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            name: event.target.value,
                                        }))
                                    }
                                />
                            </label>
                            <label className="grid gap-2 text-sm font-semibold text-slate-700">
                                Mô tả
                                <textarea
                                    className={`${fieldClass} min-h-28 py-3`}
                                    rows={4}
                                    value={form.description}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            description: event.target.value,
                                        }))
                                    }
                                />
                            </label>
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <input
                                    checked={form.status}
                                    className="size-4 min-h-0 w-4 accent-violet-600"
                                    type="checkbox"
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            status: event.target.checked,
                                        }))
                                    }
                                />
                                Đang hoạt động
                            </label>
                            <button
                                className="mt-2 min-h-11 rounded-lg bg-violet-600 px-5 text-sm font-semibold text-white transition hover:bg-violet-700"
                                disabled={saving}
                                type="submit"
                            >
                                {saving
                                    ? 'Đang lưu...'
                                    : 'Lưu phòng ban'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {selected && (
                <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/55 p-5">
                    <div
                        aria-modal="true"
                        className="max-h-[calc(100vh-40px)] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl"
                        role="dialog"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-bold tracking-wider text-violet-600 uppercase">
                                    {selected.code}
                                </p>
                                <h2 className="mt-1 text-xl font-bold text-slate-950">
                                    {selected.name}
                                </h2>
                            </div>
                            <button
                                className="min-h-9 rounded-lg bg-slate-100 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                                onClick={() => setSelected(null)}
                                type="button"
                            >
                                Đóng
                            </button>
                        </div>
                        <dl className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
                            {[
                                [
                                    'Mô tả',
                                    selected.description || 'Không có',
                                ],
                                [
                                    'Trạng thái',
                                    selected.status
                                        ? 'Hoạt động'
                                        : 'Tạm ngưng',
                                ],
                                ['Ngày tạo', formatDate(selected.createdAt)],
                                [
                                    'Ngày cập nhật',
                                    formatDate(selected.updatedAt),
                                ],
                            ].map(([label, value]) => (
                                <div className="grid gap-1 py-4" key={label}>
                                    <dt className="text-xs font-semibold text-slate-500">
                                        {label}
                                    </dt>
                                    <dd className="m-0 text-sm text-slate-800">
                                        {value}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>
            )}
        </section>
    );
}
