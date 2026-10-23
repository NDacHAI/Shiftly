import { type FormEvent, useState } from 'react';
import { SideDrawer, useToast } from '@/components/feedback';
import { Button, fieldClass } from '@/components/ui';
import { useI18n } from '@/i18n';
import { getSalaryRuleErrorKey, getSalaryRuleErrorMessage } from '../api/salary-rules.api';
import {
    type SalaryRule,
    type SalaryRulePayload,
    SalaryRuleStatus,
    type UpdateSalaryRulePayload,
} from '../types';

type SalaryRuleFormValues = SalaryRulePayload;

type SalaryRuleFormDialogProps = {
    editing: SalaryRule | null;
    saving: boolean;
    onClose: () => void;
    onSubmit: (
        payload: SalaryRulePayload | UpdateSalaryRulePayload,
    ) => Promise<void>;
};

const defaultValues: SalaryRuleFormValues = {
    code: '',
    name: '',
    multiplier: 1,
    note: '',
    status: SalaryRuleStatus.Active,
};

function getInitialValues(editing: SalaryRule | null): SalaryRuleFormValues {
    if (!editing) return defaultValues;

    return {
        code: editing.code,
        name: editing.name,
        multiplier: Number(editing.currentMultiplier ?? 1),
        note: editing.note ?? '',
        status: editing.status,
    };
}

export function SalaryRuleFormDialog({
    editing,
    saving,
    onClose,
    onSubmit,
}: SalaryRuleFormDialogProps) {
    const { showToast } = useToast();
    const { t } = useI18n();
    const [values, setValues] = useState<SalaryRuleFormValues>(() =>
        getInitialValues(editing),
    );
    const [fieldError, setFieldError] = useState('');
    const isEditing = Boolean(editing);

    function updateField<TKey extends keyof SalaryRuleFormValues>(
        key: TKey,
        value: SalaryRuleFormValues[TKey],
    ) {
        setFieldError('');
        setValues((current) => ({
            ...current,
            [key]: value,
        }));
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const status = values.status ?? SalaryRuleStatus.Active;
        const payload = isEditing
            ? {
                  name: values.name.trim(),
                  multiplier: Number(values.multiplier),
                  note: values.note?.trim() || null,
                  status,
              }
            : {
                  code: values.code.trim().toUpperCase(),
                  name: values.name.trim(),
                  multiplier: Number(values.multiplier),
                  note: values.note?.trim() || null,
                  status,
              };

        try {
            await onSubmit(payload);
        } catch (submitError) {
            const message = t(getSalaryRuleErrorKey(submitError));
            const rawMessage = getSalaryRuleErrorMessage(submitError);
            if (rawMessage.toLowerCase().includes('code')) {
                setFieldError(t('salaryRules.codeExists'));
                return;
            }

            showToast({
                message,
                title: t('salaryRules.saveError'),
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
                    ? t('salaryRules.update')
                    : t('salaryRules.add')
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
                                    {t('salaryRules.code')}
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
                                    {t('salaryRules.code')}
                                </span>
                                <span className="rounded-lg bg-stone px-3 py-2 font-semibold text-ink">
                                    {values.code}
                                </span>
                            </div>
                        )}

                        <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium text-ink">
                            <span>
                                {t('salaryRules.name')}
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

                        <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium text-ink">
                            <span>
                                {t('salaryRules.multiplier')}
                                <span className="ml-1 text-ember-strong">*</span>
                            </span>
                            <input
                                className={fieldClass}
                                min={0.01}
                                required
                                step="0.01"
                                type="number"
                                value={values.multiplier}
                                onChange={(event) =>
                                    updateField(
                                        'multiplier',
                                        Number(event.target.value),
                                    )
                                }
                            />
                        </label>

                        <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium text-ink">
                            {t('salaryRules.note')}
                            <textarea
                                className={`${fieldClass} min-h-24 py-3`}
                                maxLength={1000}
                                value={values.note ?? ''}
                                onChange={(event) =>
                                    updateField('note', event.target.value)
                                }
                            />
                        </label>

                        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-[10px] border border-rule px-4 py-3.5 text-sm font-medium text-ink">
                            <span>{t('common.active')}</span>
                            <span className="relative inline-flex">
                                <input
                                    checked={values.status === SalaryRuleStatus.Active}
                                    className="peer sr-only"
                                    role="switch"
                                    type="checkbox"
                                    onChange={(event) =>
                                        updateField(
                                            'status',
                                            event.target.checked
                                                ? SalaryRuleStatus.Active
                                                : SalaryRuleStatus.Inactive,
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
