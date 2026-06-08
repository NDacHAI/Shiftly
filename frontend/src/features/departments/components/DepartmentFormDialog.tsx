import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useForm, useWatch } from 'react-hook-form';
import { useToast } from '@/components/feedback';
import { Button } from '@/components/ui';
import { getDepartmentErrorMessage } from '../api/departments.api';
import { type Department, type DepartmentPayload } from '../types';

const fieldClass =
    'min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500';

type DepartmentFormDialogProps = {
    editing: Department | null;
    onClose: () => void;
    onSubmit: (form: DepartmentPayload) => Promise<void>;
};

export function DepartmentFormDialog({
    editing,
    onClose,
    onSubmit,
}: DepartmentFormDialogProps) {
    const { showToast } = useToast();
    const {
        control,
        formState: { errors, isSubmitting },
        handleSubmit,
        register,
        setError,
    } = useForm<DepartmentPayload>({
        defaultValues: {
            code: editing?.code ?? '',
            name: editing?.name ?? '',
            description: editing?.description ?? '',
            status: editing?.status ?? true,
        },
    });
    const status = useWatch({ control, name: 'status' });

    async function handleValidSubmit(form: DepartmentPayload) {
        try {
            await onSubmit(form);
        } catch (submitError) {
            const message = getDepartmentErrorMessage(submitError);
            const normalizedMessage = message.toLowerCase();

            if (normalizedMessage.includes('code')) {
                setError('code', {
                    message: 'Mã phòng ban đã tồn tại.',
                    type: 'server',
                });
                return;
            }

            if (normalizedMessage.includes('name')) {
                setError('name', {
                    message: 'Tên phòng ban đã tồn tại.',
                    type: 'server',
                });
                return;
            }

            showToast({
                message,
                title: 'Không thể lưu phòng ban',
                variant: 'error',
            });
        }
    }

    return (
        <div className="dialog-backdrop fixed inset-0 z-30 flex items-center justify-center bg-slate-950/55 p-5">
            <div
                aria-modal="true"
                className="dialog-panel flex max-h-[calc(100vh-40px)] w-full max-w-xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
                role="dialog"
            >
                <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
                    <h2 className="text-xl font-bold text-slate-950">
                        {editing ? 'Cập nhật phòng ban' : 'Tạo phòng ban'}
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
                    <div className="grid gap-2 overflow-y-auto px-6 py-5">
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            <span>
                                Mã phòng ban
                                <span className="ml-1 text-red-500">*</span>
                            </span>
                            <input
                                aria-describedby="department-code-error"
                                aria-invalid={Boolean(errors.code)}
                                className={`${fieldClass} ${
                                    errors.code
                                        ? 'border-2 border-red-400 focus:border-red-500 focus:ring-red-100'
                                        : ''
                                }`}
                                maxLength={20}
                                {...register('code', {
                                    maxLength: {
                                        message:
                                            'Mã phòng ban tối đa 20 ký tự.',
                                        value: 20,
                                    },
                                    required: 'Mã phòng ban là bắt buộc.',
                                })}
                            />
                            <span
                                aria-live="polite"
                                className="min-h-4 text-xs font-normal text-red-400"
                                id="department-code-error"
                            >
                                {errors.code?.message}
                            </span>
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            <span>
                                Tên phòng ban
                                <span className="ml-1 text-red-500">*</span>
                            </span>
                            <input
                                aria-describedby="department-name-error"
                                aria-invalid={Boolean(errors.name)}
                                className={`${fieldClass} ${
                                    errors.name
                                        ? 'border-2 border-red-400 focus:border-red-500 focus:ring-red-100'
                                        : ''
                                }`}
                                maxLength={100}
                                {...register('name', {
                                    maxLength: {
                                        message:
                                            'Tên phòng ban tối đa 100 ký tự.',
                                        value: 100,
                                    },
                                    required: 'Tên phòng ban là bắt buộc.',
                                })}
                            />
                            <span
                                aria-live="polite"
                                className="min-h-4 text-xs font-normal text-red-400"
                                id="department-name-error"
                            >
                                {errors.name?.message}
                            </span>
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            Mô tả
                            <textarea
                                className={`${fieldClass} min-h-28 py-3`}
                                rows={4}
                                {...register('description')}
                            />
                        </label>
                        <label className="mt-2 flex cursor-pointer items-center justify-between gap-4 text-sm font-semibold text-slate-700">
                            <span>Đang hoạt động</span>
                            <span className="relative inline-flex">
                                <input
                                    checked={status}
                                    className="peer sr-only"
                                    role="switch"
                                    type="checkbox"
                                    {...register('status')}
                                />
                                <span className="relative h-6 w-11 rounded-full bg-slate-300 transition-colors peer-checked:bg-primary-600 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-200 peer-focus-visible:ring-offset-2 after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:content-[''] peer-checked:after:translate-x-5" />
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
