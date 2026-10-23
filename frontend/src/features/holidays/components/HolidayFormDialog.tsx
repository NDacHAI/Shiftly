import { type FormEvent, useState } from 'react';
import { SideDrawer, useToast } from '@/components/feedback';
import { Button, fieldClass } from '@/components/ui';
import { useI18n } from '@/i18n';
import { getHolidayErrorKey, getHolidayErrorMessage } from '../api/holidays.api';
import {
    type Holiday,
    type HolidayPayload,
    HolidayStatus,
    type UpdateHolidayPayload,
} from '../types';

type HolidayFormValues = HolidayPayload;

type HolidayFormDialogProps = {
    editing: Holiday | null;
    saving: boolean;
    onClose: () => void;
    onSubmit: (payload: HolidayPayload | UpdateHolidayPayload) => Promise<void>;
};

const defaultValues: HolidayFormValues = {
    name: '',
    holidayDate: '',
    description: '',
    status: HolidayStatus.Active,
};

function getInitialValues(editing: Holiday | null): HolidayFormValues {
    if (!editing) return defaultValues;

    return {
        name: editing.name,
        holidayDate: editing.holidayDate,
        description: editing.description ?? '',
        status: editing.status,
    };
}

export function HolidayFormDialog({
    editing,
    saving,
    onClose,
    onSubmit,
}: HolidayFormDialogProps) {
    const { showToast } = useToast();
    const { t } = useI18n();
    const [values, setValues] = useState<HolidayFormValues>(() =>
        getInitialValues(editing),
    );
    const [fieldError, setFieldError] = useState('');

    function updateField<TKey extends keyof HolidayFormValues>(
        key: TKey,
        value: HolidayFormValues[TKey],
    ) {
        setFieldError('');
        setValues((current) => ({
            ...current,
            [key]: value,
        }));
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const payload: HolidayPayload = {
            ...values,
            name: values.name.trim(),
            description: values.description?.trim() || undefined,
            status: values.status ?? HolidayStatus.Active,
        };

        try {
            await onSubmit(payload);
        } catch (submitError) {
            const message = t(getHolidayErrorKey(submitError));
            const rawMessage = getHolidayErrorMessage(submitError);
            if (rawMessage.toLowerCase().includes('date')) {
                setFieldError(t('holidays.dateExists'));
                return;
            }

            showToast({
                message,
                title: t('holidays.saveError'),
                variant: 'error',
            });
        }
    }

    return (
        <SideDrawer
            busy={saving}
            closeLabel={t('common.close')}
            title={editing ? t('holidays.update') : t('holidays.add')}
            onClosed={onClose}
        >
            {(requestClose) => (
                <form
                    className="flex min-h-0 flex-1 flex-col"
                    onSubmit={(event) => void handleSubmit(event)}
                >
                    <div className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto px-6 py-6 max-sm:px-4">
                        <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium text-ink">
                            <span>
                                {t('holidays.name')}
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
                                {t('holidays.holidayDate')}
                                <span className="ml-1 text-ember-strong">*</span>
                            </span>
                            <input
                                className={`${fieldClass} ${
                                    fieldError
                                        ? 'border-ember-strong focus:border-ember-strong'
                                        : ''
                                }`}
                                required
                                type="date"
                                value={values.holidayDate}
                                onChange={(event) =>
                                    updateField('holidayDate', event.target.value)
                                }
                            />
                            <span className="min-h-4 text-xs font-normal text-ember-strong">
                                {fieldError}
                            </span>
                        </label>

                        <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium text-ink">
                            {t('common.description')}
                            <textarea
                                className={`${fieldClass} min-h-24 py-3`}
                                maxLength={1000}
                                value={values.description ?? ''}
                                onChange={(event) =>
                                    updateField('description', event.target.value)
                                }
                            />
                        </label>

                        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-[10px] border border-rule px-4 py-3.5 text-sm font-medium text-ink">
                            <span>{t('common.active')}</span>
                            <span className="relative inline-flex">
                                <input
                                    checked={values.status === HolidayStatus.Active}
                                    className="peer sr-only"
                                    role="switch"
                                    type="checkbox"
                                    onChange={(event) =>
                                        updateField(
                                            'status',
                                            event.target.checked
                                                ? HolidayStatus.Active
                                                : HolidayStatus.Inactive,
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
