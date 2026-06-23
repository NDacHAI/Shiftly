import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useForm, useWatch } from 'react-hook-form';
import { useToast } from '@/components/feedback';
import { Button, DropdownSelect } from '@/components/ui';
import { type Department } from '@/features/departments/types';
import { useI18n } from '@/i18n';
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
    const { t } = useI18n();
    const {
        control,
        formState: { errors, isSubmitting },
        handleSubmit,
        register,
        setError,
        setValue,
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
    const departmentId = useWatch({ control, name: 'departmentId' });

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
                    message,
                    type: 'server',
                });
                return;
            }

            showToast({
                message,
                title: t('positions.saveError'),
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
                        {editing ? t('positions.update') : t('positions.add')}
                    </h2>
                    <Button
                        aria-label={t('common.close')}
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
                                {t('positions.code')}
                                <span className="ml-1 text-red-500">*</span>
                            </span>
                            <input
                                aria-invalid={Boolean(errors.code)}
                                className={`${fieldClass} ${
                                    errors.code ? 'border-2 border-red-400' : ''
                                }`}
                                disabled={Boolean(editing)}
                                {...register('code', {
                                    maxLength: {
                                        message: t('common.required'),
                                        value: 50,
                                    },
                                    required: t('common.required'),
                                })}
                            />
                            <span className="min-h-4 text-xs font-normal text-red-400">
                                {errors.code?.message}
                            </span>
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            <span>
                                {t('positions.name')}
                                <span className="ml-1 text-red-500">*</span>
                            </span>
                            <input
                                aria-invalid={Boolean(errors.name)}
                                className={`${fieldClass} ${
                                    errors.name ? 'border-2 border-red-400' : ''
                                }`}
                                {...register('name', {
                                    maxLength: {
                                        message: t('common.required'),
                                        value: 255,
                                    },
                                    required: t('common.required'),
                                })}
                            />
                            <span className="min-h-4 text-xs font-normal text-red-400">
                                {errors.name?.message}
                            </span>
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            <span>
                                {t('common.department')}
                                <span className="ml-1 text-red-500">*</span>
                            </span>
                            <input
                                type="hidden"
                                {...register('departmentId', {
                                    required: t('common.required'),
                                })}
                            />
                            <div className="dropdown-select-field">
                                <DropdownSelect
                                    ariaLabel={t('common.department')}
                                    options={[
                                        {
                                            value: '',
                                            label: t('employees.selectDepartment'),
                                        },
                                        ...departments
                                            .filter(
                                                (department) =>
                                                    department.status ||
                                                    department.id ===
                                                        editing?.departmentId,
                                            )
                                            .map((department) => ({
                                                value: department.id,
                                                label: department.name,
                                            })),
                                    ]}
                                    value={departmentId}
                                    onChange={(value) =>
                                        setValue('departmentId', value, {
                                            shouldDirty: true,
                                            shouldValidate: true,
                                        })
                                    }
                                />
                            </div>
                            <span className="min-h-4 text-xs font-normal text-red-400">
                                {errors.departmentId?.message}
                            </span>
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            {t('common.description')}
                            <textarea
                                className={`${fieldClass} min-h-24 py-3`}
                                rows={3}
                                {...register('description')}
                            />
                        </label>
                        <label className="flex cursor-pointer items-center justify-between text-sm font-semibold text-slate-700">
                            <span>{t('common.active')}</span>
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
                            {t('common.cancel')}
                        </Button>
                        <Button
                            loading={isSubmitting}
                            loadingLabel={t('common.loadingSave')}
                            type="submit"
                        >
                            {t('common.save')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
