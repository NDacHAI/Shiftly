import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { type FormEvent, useState } from 'react';
import { Button, DropdownSelect } from '@/components/ui';
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

const fieldClass =
    'min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100';

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
        <div className="dialog-backdrop fixed inset-0 z-40 flex items-center justify-center bg-slate-950/55 p-5">
            <div
                aria-modal="true"
                className="dialog-panel flex max-h-[calc(100vh-40px)] w-full max-w-xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
                role="dialog"
            >
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                    <h2 className="text-xl font-bold text-slate-950">
                        {editing ? t('workShifts.update') : t('workShifts.add')}
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
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            <span>
                                {t('workShifts.code')}
                                <span className="ml-1 text-red-500">*</span>
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

                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            <span>
                                {t('workShifts.name')}
                                <span className="ml-1 text-red-500">*</span>
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
                            <label className="grid gap-2 text-sm font-semibold text-slate-700">
                                <span>
                                    {t('workShifts.startTime')}
                                    <span className="ml-1 text-red-500">*</span>
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

                            <label className="grid gap-2 text-sm font-semibold text-slate-700">
                                <span>
                                    {t('workShifts.endTime')}
                                    <span className="ml-1 text-red-500">*</span>
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

                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            <span>
                                {t('workShifts.breakMinutes')}
                                <span className="ml-1 text-red-500">*</span>
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

                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            {t('common.description')}
                            <textarea
                                className={`${fieldClass} min-h-24 py-3`}
                                value={values.description ?? ''}
                                onChange={(event) =>
                                    updateField('description', event.target.value)
                                }
                            />
                        </label>

                        <div className="grid gap-2 text-sm font-semibold text-slate-700">
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
