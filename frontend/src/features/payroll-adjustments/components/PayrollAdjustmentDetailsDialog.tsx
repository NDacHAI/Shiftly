import { DrawerDetails, SideDrawer } from '@/components/feedback';
import { useI18n } from '@/i18n';
import {
    type PayrollAdjustment,
    RewardPenaltyCategory,
} from '../types';

type PayrollAdjustmentDetailsDialogProps = {
    adjustment: PayrollAdjustment;
    onClose: () => void;
};

function formatDate(value: string) {
    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
    }).format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value: string) {
    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(value));
}

function formatAmount(value: string) {
    return new Intl.NumberFormat('vi-VN').format(Number(value));
}

export function PayrollAdjustmentDetailsDialog({
    adjustment,
    onClose,
}: PayrollAdjustmentDetailsDialogProps) {
    const { t } = useI18n();
    const details = [
        [t('payrollAdjustments.period'), adjustment.payrollPeriod.name],
        [
            t('payrollAdjustments.employee'),
            `${adjustment.employee.employeeCode} - ${adjustment.employee.firstName} ${adjustment.employee.lastName}`,
        ],
        [t('payrollAdjustments.branch'), adjustment.branch.name],
        [t('payrollAdjustments.catalog'), adjustment.catalogName],
        [
            t('payrollAdjustments.category'),
            adjustment.category === RewardPenaltyCategory.Reward
                ? t('payrollAdjustments.reward')
                : t('payrollAdjustments.penalty'),
        ],
        [t('payrollAdjustments.amount'), formatAmount(adjustment.amount)],
        [t('payrollAdjustments.adjustmentDate'), formatDate(adjustment.adjustmentDate)],
        [t('payrollAdjustments.reason'), adjustment.reason],
        [t('common.createdAt'), formatDateTime(adjustment.createdAt)],
        [t('common.updatedAt'), formatDateTime(adjustment.updatedAt)],
    ];

    return (
        <SideDrawer
            closeLabel={t('common.close')}
            subtitle={adjustment.catalogCode}
            title={adjustment.catalogName}
            onClosed={onClose}
        >
            {() => (
                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-2 max-sm:px-4">
                    <DrawerDetails items={details} />
                </div>
            )}
        </SideDrawer>
    );
}
