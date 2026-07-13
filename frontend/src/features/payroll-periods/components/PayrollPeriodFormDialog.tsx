import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { type FormEvent, useState } from 'react';
import { useToast } from '@/components/feedback';
import { Button } from '@/components/ui';
import { useI18n } from '@/i18n';
import { getPayrollPeriodErrorMessage } from '../api/payroll-periods.api';
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

const fieldClass =
    'min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500';

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
            const message = getPayrollPeriodErrorMessage(submitError);
            showToast({
                message,
                title: t('payrollPeriods.saveError'),
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
                            ? t('payrollPeriods.update')
                            : t('payrollPeriods.add')}
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
                        <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                            <label className="grid gap-2 text-sm font-semibold text-slate-700">
                                <span>
                                    {t('payrollPeriods.month')}
                                    <span className="ml-1 text-red-500">*</span>
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
                            <label className="grid gap-2 text-sm font-semibold text-slate-700">
                                <span>
                                    {t('payrollPeriods.year')}
                                    <span className="ml-1 text-red-500">*</span>
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
                            <label className="grid gap-2 text-sm font-semibold text-slate-700">
                                <span>
                                    {t('payrollPeriods.startDate')}
                                    <span className="ml-1 text-red-500">*</span>
                                </span>
                                <input
                                    className={`${fieldClass} ${
                                        fieldError
                                            ? 'border-2 border-red-400 focus:border-red-500 focus:ring-red-100'
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
                            <label className="grid gap-2 text-sm font-semibold text-slate-700">
                                <span>
                                    {t('payrollPeriods.endDate')}
                                    <span className="ml-1 text-red-500">*</span>
                                </span>
                                <input
                                    className={`${fieldClass} ${
                                        fieldError
                                            ? 'border-2 border-red-400 focus:border-red-500 focus:ring-red-100'
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
                        <span className="min-h-4 text-xs font-normal text-red-400">
                            {fieldError}
                        </span>
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
                            disabled={!canEdit}
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
