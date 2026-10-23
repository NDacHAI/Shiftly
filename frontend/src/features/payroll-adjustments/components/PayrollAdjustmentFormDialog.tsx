import { type FormEvent, useEffect, useState } from 'react';
import { SideDrawer, useToast } from '@/components/feedback';
import { Button, DropdownSelect, fieldClass } from '@/components/ui';
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
        <SideDrawer
            busy={saving}
            closeLabel={t('common.close')}
            title={
                editing
                    ? t('payrollAdjustments.update')
                    : t('payrollAdjustments.add')
            }
            widthClass="w-[min(640px,100%)]"
            onClosed={onClose}
        >
            {(requestClose) => (
                <form
                    className="flex min-h-0 flex-1 flex-col"
                    onSubmit={(event) => void handleSubmit(event)}
                >
                    <div className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto px-6 py-6 max-sm:px-4">
                        <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium text-ink">
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
                            <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium text-ink">
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
                            <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium text-ink">
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
                            <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium text-ink">
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
                            <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium text-ink">
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

                        <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium text-ink">
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

                        <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium text-ink">
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
