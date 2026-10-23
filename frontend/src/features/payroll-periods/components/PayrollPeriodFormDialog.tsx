import { type FormEvent, useState } from 'react';
import { SideDrawer, useToast } from '@/components/feedback';
import { Button, fieldClass } from '@/components/ui';
import { useI18n } from '@/i18n';
import { getPayrollPeriodErrorKey } from '../api/payroll-periods.api';
import {
    type PayrollPeriod,
    type PayrollPeriodPayload,
    PayrollPeriodStatus,
    type UpdatePayrollPeriodPayload,
} from '../types';

type PayrollPeriodFormDialogProps = {
    editing: PayrollPeriod | null;
    saving: boolean;
    onClose: () => void;
    onSubmit: (
        payload: PayrollPeriodPayload | UpdatePayrollPeriodPayload,
    ) => Promise<void>;
};

function defaultValues(): PayrollPeriodPayload {
    const now = new Date();
    const payrollMonth = now.getMonth() + 1;
    const payrollYear = now.getFullYear();
    const startDate = `${payrollYear}-${payrollMonth.toString().padStart(2, '0')}-01`;
    const endDate = new Date(payrollYear, payrollMonth, 0)
        .toISOString()
        .slice(0, 10);

    return {
        payrollMonth,
        payrollYear,
        startDate,
        endDate,
    };
}

function getInitialValues(editing: PayrollPeriod | null): PayrollPeriodPayload {
    if (!editing) return defaultValues();

    return {
        payrollMonth: editing.payrollMonth,
        payrollYear: editing.payrollYear,
        startDate: editing.startDate,
        endDate: editing.endDate,
    };
}

export function PayrollPeriodFormDialog({
    editing,
    saving,
    onClose,
    onSubmit,
}: PayrollPeriodFormDialogProps) {
    const { showToast } = useToast();
    const { t } = useI18n();
    const [values, setValues] = useState<PayrollPeriodPayload>(() =>
        getInitialValues(editing),
    );
    const [fieldError, setFieldError] = useState('');
    const canEdit = !editing || editing.status === PayrollPeriodStatus.Draft;

    function updateField<TKey extends keyof PayrollPeriodPayload>(
        key: TKey,
        value: PayrollPeriodPayload[TKey],
    ) {
        setFieldError('');
        setValues((current) => ({
            ...current,
            [key]: value,
        }));
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (values.startDate >= values.endDate) {
            setFieldError(t('payrollPeriods.invalidDateRange'));
            return;
        }

        try {
            await onSubmit({
                payrollMonth: Number(values.payrollMonth),
                payrollYear: Number(values.payrollYear),
                startDate: values.startDate,
                endDate: values.endDate,
            });
        } catch (submitError) {
            const message = t(getPayrollPeriodErrorKey(submitError));
            showToast({
                message,
                title: t('payrollPeriods.saveError'),
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
                    ? t('payrollPeriods.update')
                    : t('payrollPeriods.add')
            }
            onClosed={onClose}
        >
            {(requestClose) => (
                <form
                    className="flex min-h-0 flex-1 flex-col"
                    onSubmit={(event) => void handleSubmit(event)}
                >
                    <div className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto px-6 py-6 max-sm:px-4">
                        <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                            <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium text-ink">
                                <span>
                                    {t('payrollPeriods.month')}
                                    <span className="ml-1 text-ember-strong">*</span>
                                </span>
                                <input
                                    className={fieldClass}
                                    disabled={!canEdit}
                                    max={12}
                                    min={1}
                                    required
                                    type="number"
                                    value={values.payrollMonth}
                                    onChange={(event) =>
                                        updateField(
                                            'payrollMonth',
                                            Number(event.target.value),
                                        )
                                    }
                                />
                            </label>
                            <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium text-ink">
                                <span>
                                    {t('payrollPeriods.year')}
                                    <span className="ml-1 text-ember-strong">*</span>
                                </span>
                                <input
                                    className={fieldClass}
                                    disabled={!canEdit}
                                    max={2100}
                                    min={2000}
                                    required
                                    type="number"
                                    value={values.payrollYear}
                                    onChange={(event) =>
                                        updateField(
                                            'payrollYear',
                                            Number(event.target.value),
                                        )
                                    }
                                />
                            </label>
                        </div>

                        <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                            <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium text-ink">
                                <span>
                                    {t('payrollPeriods.startDate')}
                                    <span className="ml-1 text-ember-strong">*</span>
                                </span>
                                <input
                                    className={`${fieldClass} ${
                                        fieldError
                                            ? 'border-ember-strong focus:border-ember-strong'
                                            : ''
                                    }`}
                                    disabled={!canEdit}
                                    required
                                    type="date"
                                    value={values.startDate}
                                    onChange={(event) =>
                                        updateField('startDate', event.target.value)
                                    }
                                />
                            </label>
                            <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium text-ink">
                                <span>
                                    {t('payrollPeriods.endDate')}
                                    <span className="ml-1 text-ember-strong">*</span>
                                </span>
                                <input
                                    className={`${fieldClass} ${
                                        fieldError
                                            ? 'border-ember-strong focus:border-ember-strong'
                                            : ''
                                    }`}
                                    disabled={!canEdit}
                                    required
                                    type="date"
                                    value={values.endDate}
                                    onChange={(event) =>
                                        updateField('endDate', event.target.value)
                                    }
                                />
                            </label>
                        </div>
                        <span className="min-h-4 text-xs font-normal text-ember-strong">
                            {fieldError}
                        </span>
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
                            disabled={!canEdit}
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
