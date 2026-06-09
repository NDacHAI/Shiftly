import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useForm, useWatch } from 'react-hook-form';
import { useToast } from '@/components/feedback';
import { Button } from '@/components/ui';
import { type Department } from '@/features/departments/types';
import { getPositionErrorMessage } from '../api/positions.api';
import {
    type Position,
    type PositionPayload,
    type UpdatePositionPayload,
} from '../types';

type PositionFormDialogProps = {
    departments: Department[];
    editing: Position | null;
    onClose: () => void;
    onSubmit: (
        payload: PositionPayload | UpdatePositionPayload,
    ) => Promise<void>;
};

const fieldClass =
    'min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500';

export function PositionFormDialog({
    departments,
    editing,
    onClose,
    onSubmit,
}: PositionFormDialogProps) {
    const { showToast } = useToast();
    const {
        control,
        formState: { errors, isSubmitting },
        handleSubmit,
        register,
        setError,
    } = useForm<PositionPayload>({
        defaultValues: {
            code: editing?.code ?? '',
            name: editing?.name ?? '',
            departmentId: editing?.departmentId ?? '',
            description: editing?.description ?? '',
            status: editing?.status ?? true,
        },
    });
    const status = useWatch({ control, name: 'status' });

    async function handleValidSubmit(values: PositionPayload) {
        try {
            await onSubmit(
                editing
                    ? {
                          name: values.name,
                          departmentId: values.departmentId,
                          description: values.description,
                          status: values.status,
                      }
                    : values,
            );
        } catch (error) {
            const message = getPositionErrorMessage(error);

            if (message.toLowerCase().includes('code')) {
                setError('code', {
                    message: 'Mã vị trí đã tồn tại.',
                    type: 'server',
                });
                return;
            }

            showToast({
                message,
                title: 'Không thể lưu vị trí',
                variant: 'error',
            });
        }
    }

    return (
        <div className="dialog-backdrop fixed inset-0 z-40 flex items-center justify-center bg-slate-950/55 p-5">
            <div
                aria-modal="true"
                className="dialog-panel flex max-h-[calc(100vh-40px)] w-full max-w-xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
                role="dialog"
            >
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                    <h2 className="text-xl font-bold text-slate-950">
                        {editing ? 'Cập nhật vị trí' : 'Tạo vị trí'}
                    </h2>
                    <Button
                        aria-label="Đóng"
                        disabled={isSubmitting}
                        onClick={onClose}
                        size="icon"
                        variant="ghost"
                    >
                        <FontAwesomeIcon icon={faXmark} />
                    </Button>
                </div>
                <form
                    className="flex min-h-0 flex-1 flex-col"
                    onSubmit={handleSubmit(handleValidSubmit)}
                >
                    <div className="grid gap-3 overflow-y-auto px-6 py-5">
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            <span>
                                Mã vị trí
                                <span className="ml-1 text-red-500">*</span>
                            </span>
                            <input
                                aria-invalid={Boolean(errors.code)}
                                className={`${fieldClass} ${errors.code ? 'border-2 border-red-400' : ''}`}
                                disabled={Boolean(editing)}
                                {...register('code', {
                                    maxLength: {
                                        message: 'Mã tối đa 50 ký tự.',
                                        value: 50,
                                    },
                                    required: 'Mã vị trí là bắt buộc.',
                                })}
                            />
                            <span className="min-h-4 text-xs font-normal text-red-400">
                                {errors.code?.message}
                            </span>
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            <span>
                                Tên vị trí
                                <span className="ml-1 text-red-500">*</span>
                            </span>
                            <input
                                aria-invalid={Boolean(errors.name)}
                                className={`${fieldClass} ${errors.name ? 'border-2 border-red-400' : ''}`}
                                {...register('name', {
                                    maxLength: {
                                        message: 'Tên tối đa 255 ký tự.',
                                        value: 255,
                                    },
                                    required: 'Tên vị trí là bắt buộc.',
                                })}
                            />
                            <span className="min-h-4 text-xs font-normal text-red-400">
                                {errors.name?.message}
                            </span>
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            <span>
                                Phòng ban
                                <span className="ml-1 text-red-500">*</span>
                            </span>
                            <select
                                className={`${fieldClass} cursor-pointer`}
                                {...register('departmentId', {
                                    required: 'Phòng ban là bắt buộc.',
                                })}
                            >
                                <option value="">Chọn phòng ban</option>
                                {departments
                                    .filter(
                                        (department) =>
                                            department.status ||
                                            department.id ===
                                                editing?.departmentId,
                                    )
                                    .map((department) => (
                                        <option
                                            key={department.id}
                                            value={department.id}
                                        >
                                            {department.name}
                                        </option>
                                    ))}
                            </select>
                            <span className="min-h-4 text-xs font-normal text-red-400">
                                {errors.departmentId?.message}
                            </span>
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            Mô tả
                            <textarea
                                className={`${fieldClass} min-h-24 py-3`}
                                rows={3}
                                {...register('description')}
                            />
                        </label>
                        <label className="flex cursor-pointer items-center justify-between text-sm font-semibold text-slate-700">
                            <span>Đang hoạt động</span>
                            <span className="relative inline-flex">
                                <input
                                    checked={status}
                                    className="peer sr-only"
                                    role="switch"
                                    type="checkbox"
                                    {...register('status')}
                                />
                                <span className="relative h-6 w-11 rounded-full bg-slate-300 transition-colors peer-checked:bg-primary-600 after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:content-[''] peer-checked:after:translate-x-5" />
                            </span>
                        </label>
                    </div>
                    <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
                        <Button
                            disabled={isSubmitting}
                            onClick={onClose}
                            variant="secondary"
                        >
                            Hủy
                        </Button>
                        <Button
                            loading={isSubmitting}
                            loadingLabel="Đang lưu..."
                            type="submit"
                        >
                            Lưu
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
