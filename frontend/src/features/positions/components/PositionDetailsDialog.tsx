import { Button } from '@/components/ui';
import { type Position } from '../types';

type PositionDetailsDialogProps = {
    position: Position;
    onClose: () => void;
};

function formatDate(value: string) {
    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(value));
}

export function PositionDetailsDialog({
    position,
    onClose,
}: PositionDetailsDialogProps) {
    const details = [
        ['Phòng ban', position.department.name],
        ['Mô tả', position.description || 'Không có'],
        ['Trạng thái', position.status ? 'Hoạt động' : 'Tạm ngưng'],
        ['Ngày tạo', formatDate(position.createdAt)],
        ['Ngày cập nhật', formatDate(position.updatedAt)],
    ];

    return (
        <div className="dialog-backdrop fixed inset-0 z-40 flex items-center justify-center bg-slate-950/55 p-5">
            <div
                aria-modal="true"
                className="dialog-panel w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl"
                role="dialog"
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold tracking-wider text-primary-600 uppercase">
                            {position.code}
                        </p>
                        <h2 className="mt-1 text-xl font-bold text-slate-950">
                            {position.name}
                        </h2>
                    </div>
                    <Button onClick={onClose} size="sm" variant="ghost">
                        Đóng
                    </Button>
                </div>
                <dl className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
                    {details.map(([label, value]) => (
                        <div className="grid gap-1 py-4" key={label}>
                            <dt className="text-xs font-semibold text-slate-500">
                                {label}
                            </dt>
                            <dd className="text-sm text-slate-800">{value}</dd>
                        </div>
                    ))}
                </dl>
            </div>
        </div>
    );
}
