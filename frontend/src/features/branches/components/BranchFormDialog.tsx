import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useForm, useWatch } from 'react-hook-form';
import { useToast } from '@/components/feedback';
import { Button } from '@/components/ui';
import { useI18n } from '@/i18n';
import { getBranchErrorMessage } from '../api/branches.api';
import { type Branch, type BranchPayload } from '../types';

const fieldClass =
    'min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500';

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
            const message = getBranchErrorMessage(submitError);
            const normalizedMessage = message.toLowerCase();

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
        <div className="dialog-backdrop fixed inset-0 z-30 flex items-center justify-center bg-slate-950/55 p-5">
            <div
                aria-modal="true"
                className="dialog-panel flex max-h-[calc(100vh-40px)] w-full max-w-xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
                role="dialog"
            >
                <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
                    <h2 className="text-xl font-bold text-slate-950">
                        {editing ? t('branches.update') : t('branches.add')}
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
                    <div className="grid gap-2 overflow-y-auto px-6 py-5">
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            <span>
                                {t('branches.code')}
                                <span className="ml-1 text-red-500">*</span>
                            </span>
                            <input
                                aria-describedby="Branch-code-error"
                                aria-invalid={Boolean(errors.code)}
                                className={`${fieldClass} ${
                                    errors.code
                                        ? 'border-2 border-red-400 focus:border-red-500 focus:ring-red-100'
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
                                className="min-h-4 text-xs font-normal text-red-400"
                                id="Branch-code-error"
                            >
                                {errors.code?.message}
                            </span>
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            <span>
                                {t('branches.name')}
                                <span className="ml-1 text-red-500">*</span>
                            </span>
                            <input
                                aria-describedby="Branch-name-error"
                                aria-invalid={Boolean(errors.name)}
                                className={`${fieldClass} ${
                                    errors.name
                                        ? 'border-2 border-red-400 focus:border-red-500 focus:ring-red-100'
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
                                className="min-h-4 text-xs font-normal text-red-400"
                                id="Branch-name-error"
                            >
                                {errors.name?.message}
                            </span>
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            {t('common.description')}
                            <textarea
                                className={`${fieldClass} min-h-28 py-3`}
                                rows={4}
                                {...register('description')}
                            />
                        </label>
                        <label className="mt-2 flex cursor-pointer items-center justify-between gap-4 text-sm font-semibold text-slate-700">
                            <span>{t('common.active')}</span>
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
