import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { type FormEvent, useState } from 'react';
import { useToast } from '@/components/feedback';
import { Button } from '@/components/ui';
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

const fieldClass =
    'min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500';

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
        <div className="dialog-backdrop fixed inset-0 z-40 flex items-center justify-center bg-slate-950/55 p-5">
            <div
                aria-modal="true"
                className="dialog-panel flex max-h-[calc(100vh-40px)] w-full max-w-xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
                role="dialog"
            >
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                    <h2 className="text-xl font-bold text-slate-950">
                        {editing
                            ? t('salaryRules.update')
                            : t('salaryRules.add')}
                    </h2>
                    <Button
                        aria-label={t('common.close')}
                        disabled={saving}
                        onClick={onClose}
                        size="icon"
                        variant="ghost"
                    >
                        <FontAwesomeIcon icon={faXmark} />
                    </Button>
                </div>

                <form
                    className="flex min-h-0 flex-1 flex-col"
                    onSubmit={(event) => void handleSubmit(event)}
                >
                    <div className="grid gap-3 overflow-y-auto px-6 py-5">
                        {!isEditing && (
                            <label className="grid gap-2 text-sm font-semibold text-slate-700">
                                <span>
                                    {t('salaryRules.code')}
                                    <span className="ml-1 text-red-500">*</span>
                                </span>
                                <input
                                    className={`${fieldClass} ${
                                        fieldError
                                            ? 'border-2 border-red-400 focus:border-red-500 focus:ring-red-100'
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
                                <span className="min-h-4 text-xs font-normal text-red-400">
                                    {fieldError}
                                </span>
                            </label>
                        )}

                        {isEditing && (
                            <div className="grid gap-1 text-sm">
                                <span className="font-semibold text-slate-700">
                                    {t('salaryRules.code')}
                                </span>
                                <span className="rounded-lg bg-slate-100 px-3 py-2 font-semibold text-slate-700">
                                    {values.code}
                                </span>
                            </div>
                        )}

                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            <span>
                                {t('salaryRules.name')}
                                <span className="ml-1 text-red-500">*</span>
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

                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            <span>
                                {t('salaryRules.multiplier')}
                                <span className="ml-1 text-red-500">*</span>
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

                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
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

                        <label className="mt-2 flex cursor-pointer items-center justify-between gap-4 text-sm font-semibold text-slate-700">
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
                                <span className="relative h-6 w-11 rounded-full bg-slate-300 transition-colors peer-checked:bg-primary-600 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-200 peer-focus-visible:ring-offset-2 after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:content-[''] peer-checked:after:translate-x-5" />
                            </span>
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
                        <Button
                            disabled={saving}
                            onClick={onClose}
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
            </div>
        </div>
    );
}
