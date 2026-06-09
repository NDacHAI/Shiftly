import { useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBriefcase,
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
    EmptyState,
    LoadingOverlay,
    Pagination,
} from '@/components/ui';
import { listDepartments } from '@/features/departments/api/departments.api';
import { type Department } from '@/features/departments/types';
import { useDebounce } from '@/hooks/useDebounce';
import {
    createPosition,
    deletePosition,
    getPosition,
    getPositionErrorMessage,
    listPositions,
    updatePosition,
    updatePositionStatus,
} from '../api/positions.api';
import { PositionDetailsDialog } from '../components/PositionDetailsDialog';
import { PositionFormDialog } from '../components/PositionFormDialog';
import {
    type Position,
    type PositionPayload,
    type PositionSortField,
    type SortOrder,
    type UpdatePositionPayload,
} from '../types';

const pageSize = 10;
type StatusFilter = 'all' | 'active' | 'inactive';

type PositionsPageProps = {
    canManage: boolean;
};

export function PositionsPage({ canManage }: PositionsPageProps) {
    const { showToast } = useToast();
    const [positions, setPositions] = useState<Position[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [search, setSearch] = useState('');
    const [departmentId, setDepartmentId] = useState('');
    const [statusFilter, setStatusFilter] =
        useState<StatusFilter>('all');
    const [sortBy, setSortBy] = useState<PositionSortField>('createdAt');
    const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<Position | null>(null);
    const [selected, setSelected] = useState<Position | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [positionToDelete, setPositionToDelete] =
        useState<Position | null>(null);
    const [deleting, setDeleting] = useState(false);
    const debouncedSearch = useDebounce(search);

    const loadPositions = useCallback(async () => {
        setLoading(true);
        try {
            const response = await listPositions({
                page,
                limit: pageSize,
                search: debouncedSearch || undefined,
                departmentId: departmentId || undefined,
                status:
                    statusFilter === 'all'
                        ? undefined
                        : statusFilter === 'active',
                sortBy,
                sortOrder,
            });
            setPositions(response.data);
            setTotalPages(response.meta.totalPages);
        } catch (error) {
            showToast({
                message: getPositionErrorMessage(error),
                title: 'Không thể tải vị trí',
                variant: 'error',
            });
        } finally {
            setLoading(false);
        }
    }, [
        debouncedSearch,
        departmentId,
        page,
        showToast,
        sortBy,
        sortOrder,
        statusFilter,
    ]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadPositions();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [loadPositions]);

    useEffect(() => {
        let active = true;

        void listDepartments({
            page: 1,
            limit: 100,
            sortBy: 'name',
            sortOrder: 'ASC',
        })
            .then((response) => {
                if (active) setDepartments(response.data);
            })
            .catch(() => {
                showToast({
                    message: 'Không thể tải danh sách phòng ban.',
                    variant: 'error',
                });
            });

        return () => {
            active = false;
        };
    }, [showToast]);

    function changeSort(field: PositionSortField) {
        if (sortBy === field) {
            setSortOrder((current) => (current === 'ASC' ? 'DESC' : 'ASC'));
        } else {
            setSortBy(field);
            setSortOrder('ASC');
        }
        setPage(1);
    }

    async function handleSave(
        payload: PositionPayload | UpdatePositionPayload,
    ) {
        if (editing) {
            await updatePosition(editing.id, payload as UpdatePositionPayload);
        } else {
            await createPosition(payload as PositionPayload);
        }

        const wasEditing = Boolean(editing);
        setShowForm(false);
        setEditing(null);
        await loadPositions();
        showToast({
            message: wasEditing
                ? 'Đã cập nhật vị trí.'
                : 'Đã tạo vị trí mới.',
            title: 'Thành công',
            variant: 'success',
        });
    }

    async function handleStatusChange(position: Position) {
        try {
            await updatePositionStatus(position.id, !position.status);
            await loadPositions();
            showToast({
                message: 'Đã cập nhật trạng thái vị trí.',
                variant: 'success',
            });
        } catch (error) {
            showToast({
                message: getPositionErrorMessage(error),
                title: 'Không thể cập nhật trạng thái',
                variant: 'error',
            });
        }
    }

    async function handleDelete() {
        if (!positionToDelete) return;
        setDeleting(true);
        try {
            await deletePosition(positionToDelete.id);
            setPositionToDelete(null);
            await loadPositions();
            showToast({
                message:
                    'Đã xử lý xóa vị trí. Vị trí có dữ liệu liên quan sẽ được chuyển sang tạm ngưng.',
                variant: 'success',
            });
        } catch (error) {
            showToast({
                message: getPositionErrorMessage(error),
                title: 'Không thể xóa vị trí',
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
                        <FontAwesomeIcon icon={faBriefcase} />
                    </span>
                    <div>
                        <h2 className="text-xl font-bold text-slate-950">
                            Vị trí
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Quản lý chức danh theo từng phòng ban.
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
                        Thêm vị trí
                    </Button>
                )}
            </div>

            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <LoadingOverlay
                    label="Đang tải vị trí..."
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
                            placeholder="Tìm mã hoặc tên vị trí..."
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                        />
                    </label>
                    <select
                        className="min-h-11 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-sm"
                        value={departmentId}
                        onChange={(event) => {
                            setDepartmentId(event.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="">Tất cả phòng ban</option>
                        {departments.map((department) => (
                            <option key={department.id} value={department.id}>
                                {department.name}
                            </option>
                        ))}
                    </select>
                    <select
                        className="min-h-11 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-sm"
                        value={statusFilter}
                        onChange={(event) => {
                            setStatusFilter(
                                event.target.value as StatusFilter,
                            );
                            setPage(1);
                        }}
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="active">Hoạt động</option>
                        <option value="inactive">Tạm ngưng</option>
                    </select>
                    <Button
                        onClick={() => void loadPositions()}
                        size="lg"
                        variant="secondary"
                    >
                        <FontAwesomeIcon icon={faRotateRight} />
                        Làm mới
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] table-fixed">
                        <thead className="bg-slate-50">
                            <tr className="border-b border-slate-200">
                                <th className="w-[16%] px-4 py-3 text-center text-xs text-slate-600">
                                    Mã
                                </th>
                                {(
                                    [
                                        ['name', 'Tên vị trí'],
                                        ['createdAt', 'Ngày tạo'],
                                    ] as const
                                ).map(([field, label]) => (
                                    <th
                                        className="w-[22%] px-4 py-3 text-center text-xs text-slate-600"
                                        key={field}
                                    >
                                        <button
                                            className="cursor-pointer hover:text-primary-600"
                                            onClick={() => changeSort(field)}
                                            type="button"
                                        >
                                            {label}
                                            {sortBy === field
                                                ? sortOrder === 'ASC'
                                                    ? ' ↑'
                                                    : ' ↓'
                                                : ''}
                                        </button>
                                    </th>
                                ))}
                                <th className="w-[20%] px-4 py-3 text-center text-xs text-slate-600">
                                    Phòng ban
                                </th>
                                <th className="w-[16%] px-4 py-3 text-center text-xs text-slate-600">
                                    Trạng thái
                                </th>
                                <th className="w-[20%] px-4 py-3 text-center text-xs text-slate-600">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading &&
                                positions.map((position) => (
                                    <tr
                                        className="border-b border-slate-100 hover:bg-slate-50"
                                        key={position.id}
                                    >
                                        <td className="px-4 py-3 text-center text-sm font-semibold">
                                            {position.code}
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm">
                                            {position.name}
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm">
                                            {new Date(
                                                position.createdAt,
                                            ).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm">
                                            {position.department.name}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${canManage ? 'cursor-pointer' : 'cursor-default'} ${
                                                    position.status
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-amber-50 text-amber-700'
                                                }`}
                                                disabled={!canManage}
                                                onClick={() =>
                                                    void handleStatusChange(
                                                        position,
                                                    )
                                                }
                                                type="button"
                                            >
                                                {position.status
                                                    ? 'Hoạt động'
                                                    : 'Tạm ngưng'}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-center gap-2">
                                                <Button
                                                    aria-label="Xem chi tiết"
                                                    onClick={() =>
                                                        void getPosition(
                                                            position.id,
                                                        ).then(setSelected)
                                                    }
                                                    size="icon"
                                                    variant="ghost"
                                                >
                                                    <FontAwesomeIcon
                                                        icon={faEye}
                                                    />
                                                </Button>
                                                {canManage && (
                                                    <>
                                                        <Button
                                                            aria-label="Chỉnh sửa"
                                                            onClick={() => {
                                                                setEditing(
                                                                    position,
                                                                );
                                                                setShowForm(
                                                                    true,
                                                                );
                                                            }}
                                                            size="icon"
                                                            variant="secondary"
                                                        >
                                                            <FontAwesomeIcon
                                                                icon={faPen}
                                                            />
                                                        </Button>
                                                        <Button
                                                            aria-label="Xóa"
                                                            onClick={() =>
                                                                setPositionToDelete(
                                                                    position,
                                                                )
                                                            }
                                                            size="icon"
                                                            variant="danger"
                                                        >
                                                            <FontAwesomeIcon
                                                                icon={faTrash}
                                                            />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            {!loading && positions.length === 0 && (
                                <tr>
                                    <td colSpan={6}>
                                        <EmptyState
                                            description="Thử thay đổi từ khóa hoặc bộ lọc."
                                            icon={
                                                <FontAwesomeIcon
                                                    icon={faBriefcase}
                                                />
                                            }
                                            title="Chưa có vị trí phù hợp"
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
                <PositionFormDialog
                    departments={departments}
                    editing={editing}
                    onClose={() => setShowForm(false)}
                    onSubmit={handleSave}
                />
            )}
            {selected && (
                <PositionDetailsDialog
                    position={selected}
                    onClose={() => setSelected(null)}
                />
            )}
            <ConfirmDialog
                confirmLabel="Xóa vị trí"
                description={`Xóa vị trí "${positionToDelete?.name ?? ''}"? Nếu đã có dữ liệu liên quan, vị trí sẽ được chuyển sang tạm ngưng.`}
                loading={deleting}
                open={Boolean(positionToDelete)}
                title="Xác nhận xóa"
                tone="danger"
                onCancel={() => setPositionToDelete(null)}
                onConfirm={() => void handleDelete()}
            />
        </section>
    );
}
