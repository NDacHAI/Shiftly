import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { type FormEvent, useEffect, useState } from 'react';
import { useToast } from '@/components/feedback';
import { Button, DropdownSelect } from '@/components/ui';
import { type Branch } from '@/features/branches/types';
import { type Employee } from '@/features/employees/types';
import { type PayrollPeriod } from '@/features/payroll-periods/types';
import { type RewardPenaltyCatalog } from '@/features/reward-penalty-catalogs/types';
import { useI18n } from '@/i18n';
import { getPayrollAdjustmentErrorKey } from '../api/payroll-adjustments.api';
import {
    type PayrollAdjustment,
    type PayrollAdjustmentPayload,
    type UpdatePayrollAdjustmentPayload,
} from '../types';

type PayrollAdjustmentFormDialogProps = {
    catalogs: RewardPenaltyCatalog[];
    editing: PayrollAdjustment | null;
    employees: Employee[];
    periods: PayrollPeriod[];
    saving: boolean;
    onClose: () => void;
    onSubmit: (
        payload: PayrollAdjustmentPayload | UpdatePayrollAdjustmentPayload,
    ) => Promise<void>;
};

const fieldClass =
    'min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500';

function today() {
    return new Date().toISOString().slice(0, 10);
}

function getInitialValues(
    editing: PayrollAdjustment | null,
): PayrollAdjustmentPayload {
    if (!editing) {
        return {
            payrollPeriodId: '',
            employeeId: '',
            branchId: '',
            catalogId: '',
            amount: 0,
            reason: '',
            adjustmentDate: today(),
        };
    }

    return {
        payrollPeriodId: editing.payrollPeriodId,
        employeeId: editing.employeeId,
        branchId: editing.branchId,
        catalogId: editing.catalogId,
        amount: Number(editing.amount),
        reason: editing.reason,
        adjustmentDate: editing.adjustmentDate,
    };
}

function formatEmployee(employee: Employee) {
    return `${employee.employeeCode} - ${employee.firstName} ${employee.lastName}`;
}

export function PayrollAdjustmentFormDialog({
    catalogs,
    editing,
    employees,
    periods,
    saving,
    onClose,
    onSubmit,
}: PayrollAdjustmentFormDialogProps) {
    const { showToast } = useToast();
    const { t } = useI18n();
    const [values, setValues] = useState<PayrollAdjustmentPayload>(() =>
        getInitialValues(editing),
    );
    const selectedEmployee = employees.find(
        (employee) => employee.id === values.employeeId,
    );
    const employeeBranches: Branch[] = selectedEmployee?.branches ?? [];

    useEffect(() => {
        if (
            values.branchId &&
            !employeeBranches.some((branch) => branch.id === values.branchId)
        ) {
            setValues((current) => ({ ...current, branchId: '' }));
        }
    }, [employeeBranches, values.branchId]);

    function updateField<TKey extends keyof PayrollAdjustmentPayload>(
        key: TKey,
        value: PayrollAdjustmentPayload[TKey],
    ) {
        setValues((current) => ({
            ...current,
            [key]: value,
        }));
    }

    function handleCatalogChange(catalogId: string) {
        const catalog = catalogs.find((item) => item.id === catalogId);
        setValues((current) => ({
            ...current,
            catalogId,
            amount: catalog ? Number(catalog.amount) : current.amount,
        }));
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            await onSubmit({
                ...values,
                amount: Number(values.amount),
                reason: values.reason.trim(),
            });
        } catch (submitError) {
            showToast({
                message: t(getPayrollAdjustmentErrorKey(submitError)),
                title: t('payrollAdjustments.saveError'),
                variant: 'error',
            });
        }
    }

    return (
        <div className="dialog-backdrop fixed inset-0 z-40 flex items-center justify-center bg-slate-950/55 p-5">
            <div
                aria-modal="true"
                className="dialog-panel flex max-h-[calc(100vh-40px)] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
                role="dialog"
            >
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                    <h2 className="text-xl font-bold text-slate-950">
                        {editing
                            ? t('payrollAdjustments.update')
                            : t('payrollAdjustments.add')}
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
                            <span>{t('payrollAdjustments.period')} *</span>
                            <DropdownSelect
                                ariaLabel={t('payrollAdjustments.period')}
                                options={[
                                    {
                                        value: '',
                                        label: t('payrollAdjustments.selectPeriod'),
                                    },
                                    ...periods.map((period) => ({
                                        value: period.id,
                                        label: period.name,
                                    })),
                                ]}
                                value={values.payrollPeriodId}
                                onChange={(value) =>
                                    updateField('payrollPeriodId', value)
                                }
                            />
                        </label>

                        <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                            <label className="grid gap-2 text-sm font-semibold text-slate-700">
                                <span>{t('payrollAdjustments.employee')} *</span>
                                <DropdownSelect
                                    ariaLabel={t('payrollAdjustments.employee')}
                                    options={[
                                        {
                                            value: '',
                                            label: t(
                                                'payrollAdjustments.selectEmployee',
                                            ),
                                        },
                                        ...employees.map((employee) => ({
                                            value: employee.id,
                                            label: formatEmployee(employee),
                                        })),
                                    ]}
                                    value={values.employeeId}
                                    onChange={(value) =>
                                        updateField('employeeId', value)
                                    }
                                />
                            </label>
                            <label className="grid gap-2 text-sm font-semibold text-slate-700">
                                <span>{t('payrollAdjustments.branch')} *</span>
                                <DropdownSelect
                                    ariaLabel={t('payrollAdjustments.branch')}
                                    options={[
                                        {
                                            value: '',
                                            label: t(
                                                'payrollAdjustments.selectBranch',
                                            ),
                                        },
                                        ...employeeBranches.map((branch) => ({
                                            value: branch.id,
                                            label: branch.name,
                                        })),
                                    ]}
                                    value={values.branchId}
                                    onChange={(value) =>
                                        updateField('branchId', value)
                                    }
                                />
                            </label>
                        </div>

                        <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                            <label className="grid gap-2 text-sm font-semibold text-slate-700">
                                <span>{t('payrollAdjustments.catalog')} *</span>
                                <DropdownSelect
                                    ariaLabel={t('payrollAdjustments.catalog')}
                                    options={[
                                        {
                                            value: '',
                                            label: t(
                                                'payrollAdjustments.selectCatalog',
                                            ),
                                        },
                                        ...catalogs.map((catalog) => ({
                                            value: catalog.id,
                                            label: catalog.name,
                                        })),
                                    ]}
                                    value={values.catalogId}
                                    onChange={handleCatalogChange}
                                />
                            </label>
                            <label className="grid gap-2 text-sm font-semibold text-slate-700">
                                <span>{t('payrollAdjustments.amount')} *</span>
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

                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            <span>{t('payrollAdjustments.adjustmentDate')} *</span>
                            <input
                                className={fieldClass}
                                required
                                type="date"
                                value={values.adjustmentDate}
                                onChange={(event) =>
                                    updateField(
                                        'adjustmentDate',
                                        event.target.value,
                                    )
                                }
                            />
                        </label>

                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            <span>{t('payrollAdjustments.reason')} *</span>
                            <textarea
                                className={`${fieldClass} min-h-24 py-3`}
                                maxLength={500}
                                required
                                value={values.reason}
                                onChange={(event) =>
                                    updateField('reason', event.target.value)
                                }
                            />
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
