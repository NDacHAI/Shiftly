import { type FormEvent, useState } from 'react';
import { Button, DropdownSelect, fieldClass } from '@/components/ui';
import { SideDrawer } from '@/components/feedback';
import { useI18n } from '@/i18n';
import {
    type UpdateWorkShiftPayload,
    type WorkShift,
    type WorkShiftPayload,
    WorkShiftStatus,
} from '../types';

type WorkShiftFormValues = WorkShiftPayload;

type WorkShiftFormDialogProps = {
    editing: WorkShift | null;
    saving: boolean;
    onClose: () => void;
    onSubmit: (
        payload: WorkShiftPayload | UpdateWorkShiftPayload,
    ) => Promise<void>;
};

const defaultValues: WorkShiftFormValues = {
    code: '',
    name: '',
    startTime: '08:00',
    endTime: '17:00',
    breakMinutes: 0,
    description: '',
    status: WorkShiftStatus.Active,
};

function getInitialValues(editing: WorkShift | null): WorkShiftFormValues {
    if (!editing) return defaultValues;

    return {
        code: editing.code,
        name: editing.name,
        startTime: editing.startTime.slice(0, 5),
        endTime: editing.endTime.slice(0, 5),
        breakMinutes: editing.breakMinutes,
        description: editing.description ?? '',
        status: editing.status,
    };
}

export function WorkShiftFormDialog({
    editing,
    saving,
    onClose,
    onSubmit,
}: WorkShiftFormDialogProps) {
    const { t } = useI18n();
    const [values, setValues] = useState<WorkShiftFormValues>(() =>
        getInitialValues(editing),
    );

    function updateField<TKey extends keyof WorkShiftFormValues>(
        key: TKey,
        value: WorkShiftFormValues[TKey],
    ) {
        setValues((current) => ({
            ...current,
            [key]: value,
        }));
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const payload: WorkShiftPayload = {
            ...values,
            code: values.code.trim(),
            name: values.name.trim(),
            breakMinutes: Number(values.breakMinutes),
            description: values.description?.trim() || undefined,
        };

        await onSubmit(payload);
    }

    return (
        <SideDrawer
            busy={saving}
            closeLabel={t('common.close')}
            title={editing ? t('workShifts.update') : t('workShifts.add')}
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
                                {t('workShifts.code')}
                                <span className="ml-1 text-ember-strong">*</span>
                            </span>
                            <input
                                className={fieldClass}
                                maxLength={50}
                                required
                                value={values.code}
                                onChange={(event) =>
                                    updateField('code', event.target.value)
                                }
                            />
                        </label>

                        <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium text-ink">
                            <span>
                                {t('workShifts.name')}
                                <span className="ml-1 text-ember-strong">*</span>
                            </span>
                            <input
                                className={fieldClass}
                                maxLength={50}
                                required
                                value={values.name}
                                onChange={(event) =>
                                    updateField('name', event.target.value)
                                }
                            />
                        </label>

                        <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                            <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium text-ink">
                                <span>
                                    {t('workShifts.startTime')}
                                    <span className="ml-1 text-ember-strong">*</span>
                                </span>
                                <input
                                    className={fieldClass}
                                    required
                                    type="time"
                                    value={values.startTime}
                                    onChange={(event) =>
                                        updateField(
                                            'startTime',
                                            event.target.value,
                                        )
                                    }
                                />
                            </label>

                            <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium text-ink">
                                <span>
                                    {t('workShifts.endTime')}
                                    <span className="ml-1 text-ember-strong">*</span>
                                </span>
                                <input
                                    className={fieldClass}
                                    required
                                    type="time"
                                    value={values.endTime}
                                    onChange={(event) =>
                                        updateField('endTime', event.target.value)
                                    }
                                />
                            </label>
                        </div>

                        <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium text-ink">
                            <span>
                                {t('workShifts.breakMinutes')}
                                <span className="ml-1 text-ember-strong">*</span>
                            </span>
                            <input
                                className={fieldClass}
                                max={1440}
                                min={0}
                                required
                                type="number"
                                value={values.breakMinutes}
                                onChange={(event) =>
                                    updateField(
                                        'breakMinutes',
                                        Number(event.target.value),
                                    )
                                }
                            />
                        </label>

                        <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium text-ink">
                            {t('common.description')}
                            <textarea
                                className={`${fieldClass} min-h-24 py-3`}
                                value={values.description ?? ''}
                                onChange={(event) =>
                                    updateField('description', event.target.value)
                                }
                            />
                        </label>

                        <div className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium text-ink">
                            {t('common.status')}
                            <DropdownSelect
                                ariaLabel={t('common.status')}
                                options={[
                                    {
                                        value: String(WorkShiftStatus.Active),
                                        label: t('common.active'),
                                    },
                                    {
                                        value: String(WorkShiftStatus.Inactive),
                                        label: t('common.inactive'),
                                    },
                                ]}
                                value={String(values.status)}
                                onChange={(value) =>
                                    updateField(
                                        'status',
                                        Number(value) as WorkShiftStatus,
                                    )
                                }
                            />
                        </div>
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
