import { useForm, useWatch } from 'react-hook-form';
import { SideDrawer, useToast } from '@/components/feedback';
import { Button, fieldClass } from '@/components/ui';
import { useI18n } from '@/i18n';
import { getBranchErrorKey, getBranchErrorMessage } from '../api/branches.api';
import { type Branch, type BranchPayload } from '../types';

type BranchFormDialogProps = {
    editing: Branch | null;
    onClose: () => void;
    onSubmit: (form: BranchPayload) => Promise<void>;
};

export function BranchFormDialog({
    editing,
    onClose,
    onSubmit,
}: BranchFormDialogProps) {
    const { showToast } = useToast();
    const { t } = useI18n();
    const {
        control,
        formState: { errors, isSubmitting },
        handleSubmit,
        register,
        setError,
    } = useForm<BranchPayload>({
        defaultValues: {
            code: editing?.code ?? '',
            name: editing?.name ?? '',
            description: editing?.description ?? '',
            status: editing?.status ?? true,
        },
    });
    const status = useWatch({ control, name: 'status' });

    async function handleValidSubmit(form: BranchPayload) {
        try {
            await onSubmit(form);
        } catch (submitError) {
            const message = t(getBranchErrorKey(submitError));
            const rawMessage = getBranchErrorMessage(submitError);
            const normalizedMessage = rawMessage.toLowerCase();

            if (normalizedMessage.includes('code')) {
                setError('code', {
                    message: t('branches.codeExists'),
                    type: 'server',
                });
                return;
            }

            if (normalizedMessage.includes('name')) {
                setError('name', {
                    message: t('branches.nameExists'),
                    type: 'server',
                });
                return;
            }

            showToast({
                message,
                title: t('branches.saveError'),
                variant: 'error',
            });
        }
    }

    return (
        <SideDrawer
            busy={isSubmitting}
            closeLabel={t('common.close')}
            title={editing ? t('branches.update') : t('branches.add')}
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
                                {t('branches.code')}
                                <span className="ml-1 text-ember-strong">*</span>
                            </span>
                            <input
                                aria-describedby="Branch-code-error"
                                aria-invalid={Boolean(errors.code)}
                                className={`${fieldClass} ${
                                    errors.code
                                        ? 'border-ember-strong focus:border-ember-strong'
                                        : ''
                                }`}
                                maxLength={20}
                                {...register('code', {
                                    maxLength: {
                                        message: t('branches.codeMaxLength'),
                                        value: 20,
                                    },
                                    required: t('branches.codeRequired'),
                                })}
                            />
                            <span
                                aria-live="polite"
                                className="min-h-4 text-xs font-normal text-ember-strong"
                                id="Branch-code-error"
                            >
                                {errors.code?.message}
                            </span>
                        </label>
                        <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium text-ink">
                            <span>
                                {t('branches.name')}
                                <span className="ml-1 text-ember-strong">*</span>
                            </span>
                            <input
                                aria-describedby="Branch-name-error"
                                aria-invalid={Boolean(errors.name)}
                                className={`${fieldClass} ${
                                    errors.name
                                        ? 'border-ember-strong focus:border-ember-strong'
                                        : ''
                                }`}
                                maxLength={100}
                                {...register('name', {
                                    maxLength: {
                                        message: t('branches.nameMaxLength'),
                                        value: 100,
                                    },
                                    required: t('branches.nameRequired'),
                                })}
                            />
                            <span
                                aria-live="polite"
                                className="min-h-4 text-xs font-normal text-ember-strong"
                                id="Branch-name-error"
                            >
                                {errors.name?.message}
                            </span>
                        </label>
                        <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium text-ink">
                            {t('common.description')}
                            <textarea
                                className={`${fieldClass} min-h-28 py-3`}
                                rows={4}
                                {...register('description')}
                            />
                        </label>
                        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-[10px] border border-rule px-4 py-3.5 text-sm font-medium text-ink">
                            <span>{t('common.active')}</span>
                            <span className="relative inline-flex">
                                <input
                                    checked={status}
                                    className="peer sr-only"
                                    role="switch"
                                    type="checkbox"
                                    {...register('status')}
                                />
                                <span className="relative h-6 w-11 rounded-full bg-rule-strong transition-colors peer-checked:bg-ink peer-focus-visible:ring-2 peer-focus-visible:ring-ink/25 peer-focus-visible:ring-offset-2 after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:content-[''] peer-checked:after:translate-x-5" />
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
