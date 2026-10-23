import { useForm, useWatch } from 'react-hook-form';
import { SideDrawer, useToast } from '@/components/feedback';
import { Button, DropdownSelect, fieldClass } from '@/components/ui';
import { type Branch } from '@/features/branches/types';
import { useI18n } from '@/i18n';
import { getPositionErrorKey, getPositionErrorMessage } from '../api/positions.api';
import {
    type Position,
    type PositionPayload,
    type UpdatePositionPayload,
} from '../types';

type PositionFormDialogProps = {
    branches: Branch[];
    editing: Position | null;
    onClose: () => void;
    onSubmit: (
        payload: PositionPayload | UpdatePositionPayload,
    ) => Promise<void>;
};

export function PositionFormDialog({
    branches,
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
            branchId: editing?.branchId ?? '',
            description: editing?.description ?? '',
            hourlyRate: Number(editing?.hourlyRate ?? 0),
            status: editing?.status ?? true,
        },
    });
    const status = useWatch({ control, name: 'status' });
    const branchId = useWatch({ control, name: 'branchId' });
    const hourlyRate = useWatch({ control, name: 'hourlyRate' });

    function formatCurrency(value: number | undefined) {
        const numericValue =
            typeof value === 'number' && Number.isFinite(value) ? value : 0;

        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(numericValue);
    }

    async function handleValidSubmit(values: PositionPayload) {
        try {
            await onSubmit(
                editing
                    ? {
                          name: values.name,
                          branchId: values.branchId,
                          description: values.description,
                          hourlyRate: Number(values.hourlyRate ?? 0),
                          status: values.status,
                      }
                    : {
                          ...values,
                          hourlyRate: Number(values.hourlyRate ?? 0),
                      },
            );
        } catch (error) {
            const message = t(getPositionErrorKey(error));
            const rawMessage = getPositionErrorMessage(error);

            if (rawMessage.toLowerCase().includes('code')) {
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
        <SideDrawer
            busy={isSubmitting}
            closeLabel={t('common.close')}
            title={editing ? t('positions.update') : t('positions.add')}
            onClosed={onClose}
        >
            {(requestClose) => (
                <form
                    className="flex min-h-0 flex-1 flex-col"
                    onSubmit={handleSubmit(handleValidSubmit)}
                >
                    <div className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto px-6 py-6 max-sm:px-4">
                        <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium text-ink">
                            <span>
                                {t('positions.code')}
                                <span className="ml-1 text-ember-strong">*</span>
                            </span>
                            <input
                                aria-invalid={Boolean(errors.code)}
                                className={`${fieldClass} ${
                                    errors.code ? 'border-ember-strong' : ''
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
                            <span className="min-h-4 text-xs font-normal text-ember-strong">
                                {errors.code?.message}
                            </span>
                        </label>
                        <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium text-ink">
                            <span>
                                {t('positions.name')}
                                <span className="ml-1 text-ember-strong">*</span>
                            </span>
                            <input
                                aria-invalid={Boolean(errors.name)}
                                className={`${fieldClass} ${
                                    errors.name ? 'border-ember-strong' : ''
                                }`}
                                {...register('name', {
                                    maxLength: {
                                        message: t('common.required'),
                                        value: 255,
                                    },
                                    required: t('common.required'),
                                })}
                            />
                            <span className="min-h-4 text-xs font-normal text-ember-strong">
                                {errors.name?.message}
                            </span>
                        </label>
                        <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium text-ink">
                            <span>
                                {t('common.branch')}
                                <span className="ml-1 text-ember-strong">*</span>
                            </span>
                            <input
                                type="hidden"
                                {...register('branchId', {
                                    required: t('common.required'),
                                })}
                            />
                            <div className="dropdown-select-field">
                                <DropdownSelect
                                    ariaLabel={t('common.branch')}
                                    options={[
                                        {
                                            value: '',
                                            label: t('employees.selectBranch'),
                                        },
                                        ...branches
                                            .filter(
                                                (branch) =>
                                                    branch.status ||
                                                    branch.id ===
                                                        editing?.branchId,
                                            )
                                            .map((branch) => ({
                                                value: branch.id,
                                                label: branch.name,
                                            })),
                                    ]}
                                    value={branchId}
                                    onChange={(value) =>
                                        setValue('branchId', value, {
                                            shouldDirty: true,
                                            shouldValidate: true,
                                        })
                                    }
                                />
                            </div>
                            <span className="min-h-4 text-xs font-normal text-ember-strong">
                                {errors.branchId?.message}
                            </span>
                        </label>
                        <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium text-ink">
                            {t('positions.hourlyRate')}
                            <input
                                className={fieldClass}
                                min={0}
                                step="1000"
                                type="number"
                                {...register('hourlyRate', {
                                    min: {
                                        message: t('common.required'),
                                        value: 0,
                                    },
                                    valueAsNumber: true,
                                })}
                            />
                            <span className="text-xs font-medium text-muted">
                                {formatCurrency(hourlyRate)}
                            </span>
                            <span className="min-h-4 text-xs font-normal text-ember-strong">
                                {errors.hourlyRate?.message}
                            </span>
                        </label>
                        <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium text-ink">
                            {t('common.description')}
                            <textarea
                                className={`${fieldClass} min-h-24 py-3`}
                                rows={3}
                                {...register('description')}
                            />
                        </label>
                        <label className="flex cursor-pointer items-center justify-between rounded-[10px] border border-rule px-4 py-3.5 text-sm font-medium text-ink">
                            <span>{t('common.active')}</span>
                            <span className="relative inline-flex">
                                <input
                                    checked={status}
                                    className="peer sr-only"
                                    role="switch"
                                    type="checkbox"
                                    {...register('status')}
                                />
                                <span className="relative h-6 w-11 rounded-full bg-rule-strong transition-colors peer-checked:bg-ink after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:content-[''] peer-checked:after:translate-x-5" />
                            </span>
                        </label>
                    </div>
                    <div className="flex justify-end gap-2 border-t border-rule px-6 py-4 max-sm:px-4">
                        <Button
                            disabled={isSubmitting}
                            onClick={requestClose}
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
            )}
        </SideDrawer>
    );
}
