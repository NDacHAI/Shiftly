import { type FormEvent, useState } from 'react';
import { SideDrawer, useToast } from '@/components/feedback';
import { Button, DropdownSelect, fieldClass } from '@/components/ui';
import { useI18n } from '@/i18n';
import { getRewardPenaltyCatalogErrorKey, getRewardPenaltyCatalogErrorMessage } from '../api/reward-penalty-catalogs.api';
import {
    type RewardPenaltyCatalog,
    RewardPenaltyCategory,
    type RewardPenaltyCatalogPayload,
    RewardPenaltyStatus,
    type UpdateRewardPenaltyCatalogPayload,
} from '../types';

type RewardPenaltyCatalogFormValues = RewardPenaltyCatalogPayload;

type RewardPenaltyCatalogFormDialogProps = {
    editing: RewardPenaltyCatalog | null;
    saving: boolean;
    onClose: () => void;
    onSubmit: (
        payload:
            | RewardPenaltyCatalogPayload
            | UpdateRewardPenaltyCatalogPayload,
    ) => Promise<void>;
};

const defaultValues: RewardPenaltyCatalogFormValues = {
    code: '',
    name: '',
    category: RewardPenaltyCategory.Reward,
    amount: 1,
    description: '',
    status: RewardPenaltyStatus.Active,
};

function getInitialValues(
    editing: RewardPenaltyCatalog | null,
): RewardPenaltyCatalogFormValues {
    if (!editing) return defaultValues;

    return {
        code: editing.code,
        name: editing.name,
        category: editing.category,
        amount: Number(editing.amount),
        description: editing.description ?? '',
        status: editing.status,
    };
}

export function RewardPenaltyCatalogFormDialog({
    editing,
    saving,
    onClose,
    onSubmit,
}: RewardPenaltyCatalogFormDialogProps) {
    const { showToast } = useToast();
    const { t } = useI18n();
    const [values, setValues] = useState<RewardPenaltyCatalogFormValues>(() =>
        getInitialValues(editing),
    );
    const [fieldError, setFieldError] = useState('');
    const isEditing = Boolean(editing);

    function updateField<TKey extends keyof RewardPenaltyCatalogFormValues>(
        key: TKey,
        value: RewardPenaltyCatalogFormValues[TKey],
    ) {
        setFieldError('');
        setValues((current) => ({
            ...current,
            [key]: value,
        }));
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const status = values.status ?? RewardPenaltyStatus.Active;
        const payload = isEditing
            ? {
                  name: values.name.trim(),
                  category: values.category,
                  amount: Number(values.amount),
                  description: values.description?.trim() || null,
                  status,
              }
            : {
                  code: values.code.trim().toUpperCase(),
                  name: values.name.trim(),
                  category: values.category,
                  amount: Number(values.amount),
                  description: values.description?.trim() || null,
                  status,
              };

        try {
            await onSubmit(payload);
        } catch (submitError) {
            const message = t(getRewardPenaltyCatalogErrorKey(submitError));
            const rawMessage = getRewardPenaltyCatalogErrorMessage(submitError);
            if (rawMessage.toLowerCase().includes('code')) {
                setFieldError(t('rewardPenaltyCatalogs.codeExists'));
                return;
            }

            showToast({
                message,
                title: t('rewardPenaltyCatalogs.saveError'),
                variant: 'error',
            });
        }
    }

    return (
        <SideDrawer
            busy={saving}
            closeLabel={t('common.close')}
            title={
                editing
                    ? t('rewardPenaltyCatalogs.update')
                    : t('rewardPenaltyCatalogs.add')
            }
            onClosed={onClose}
        >
            {(requestClose) => (
                <form
                    className="flex min-h-0 flex-1 flex-col"
                    onSubmit={(event) => void handleSubmit(event)}
                >
                    <div className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto px-6 py-6 max-sm:px-4">
                        {!isEditing && (
                            <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium text-ink">
                                <span>
                                    {t('rewardPenaltyCatalogs.code')}
                                    <span className="ml-1 text-ember-strong">*</span>
                                </span>
                                <input
                                    className={`${fieldClass} ${
                                        fieldError
                                            ? 'border-ember-strong focus:border-ember-strong'
                                            : ''
                                    }`}
                                    maxLength={50}
                                    pattern="[A-Za-z0-9_]+"
                                    required
                                    value={values.code}
                                    onChange={(event) =>
                                        updateField('code', event.target.value)
                                    }
                                />
                                <span className="min-h-4 text-xs font-normal text-ember-strong">
                                    {fieldError}
                                </span>
                            </label>
                        )}

                        {isEditing && (
                            <div className="grid gap-1 text-sm">
                                <span className="font-semibold text-ink">
                                    {t('rewardPenaltyCatalogs.code')}
                                </span>
                                <span className="rounded-lg bg-stone px-3 py-2 font-semibold text-ink">
                                    {values.code}
                                </span>
                            </div>
                        )}

                        <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium text-ink">
                            <span>
                                {t('rewardPenaltyCatalogs.name')}
                                <span className="ml-1 text-ember-strong">*</span>
                            </span>
                            <input
                                className={fieldClass}
                                maxLength={255}
                                required
                                value={values.name}
                                onChange={(event) =>
                                    updateField('name', event.target.value)
                                }
                            />
                        </label>

                        <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                            <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium text-ink">
                                {t('rewardPenaltyCatalogs.category')}
                                <DropdownSelect
                                    ariaLabel={t(
                                        'rewardPenaltyCatalogs.category',
                                    )}
                                    options={[
                                        {
                                            value: String(
                                                RewardPenaltyCategory.Reward,
                                            ),
                                            label: t(
                                                'rewardPenaltyCatalogs.reward',
                                            ),
                                        },
                                        {
                                            value: String(
                                                RewardPenaltyCategory.Penalty,
                                            ),
                                            label: t(
                                                'rewardPenaltyCatalogs.penalty',
                                            ),
                                        },
                                    ]}
                                    value={String(values.category)}
                                    onChange={(value) =>
                                        updateField('category', Number(value))
                                    }
                                />
                            </label>

                            <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium text-ink">
                                <span>
                                    {t('rewardPenaltyCatalogs.amount')}
                                    <span className="ml-1 text-ember-strong">*</span>
                                </span>
                                <input
                                    className={fieldClass}
                                    min={0.01}
                                    required
                                    step="0.01"
                                    type="number"
                                    value={values.amount}
                                    onChange={(event) =>
                                        updateField(
                                            'amount',
                                            Number(event.target.value),
                                        )
                                    }
                                />
                            </label>
                        </div>

                        <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium text-ink">
                            {t('rewardPenaltyCatalogs.description')}
                            <textarea
                                className={`${fieldClass} min-h-24 py-3`}
                                maxLength={1000}
                                value={values.description ?? ''}
                                onChange={(event) =>
                                    updateField(
                                        'description',
                                        event.target.value,
                                    )
                                }
                            />
                        </label>

                        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-[10px] border border-rule px-4 py-3.5 text-sm font-medium text-ink">
                            <span>{t('common.active')}</span>
                            <span className="relative inline-flex">
                                <input
                                    checked={
                                        values.status ===
                                        RewardPenaltyStatus.Active
                                    }
                                    className="peer sr-only"
                                    role="switch"
                                    type="checkbox"
                                    onChange={(event) =>
                                        updateField(
                                            'status',
                                            event.target.checked
                                                ? RewardPenaltyStatus.Active
                                                : RewardPenaltyStatus.Inactive,
                                        )
                                    }
                                />
                                <span className="relative h-6 w-11 rounded-full bg-rule-strong transition-colors peer-checked:bg-ink peer-focus-visible:ring-2 peer-focus-visible:ring-ink/25 peer-focus-visible:ring-offset-2 after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:content-[''] peer-checked:after:translate-x-5" />
                            </span>
                        </label>
                    </div>

                    <div className="flex justify-end gap-2 border-t border-rule px-6 py-4 max-sm:px-4">
                        <Button
                            disabled={saving}
                            onClick={requestClose}
                            variant="secondary"
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            loading={saving}
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
