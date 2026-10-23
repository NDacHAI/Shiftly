import { DrawerDetails, SideDrawer } from '@/components/feedback';
import { useI18n } from '@/i18n';
import { type PayrollPeriod, PayrollPeriodStatus } from '../types';

type PayrollPeriodDetailsDialogProps = {
    period: PayrollPeriod;
    onClose: () => void;
};

function formatDate(value: string) {
    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
    }).format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value: string | null) {
    if (!value) return '-';

    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(value));
}

function statusKey(status: PayrollPeriodStatus) {
    if (status === PayrollPeriodStatus.Draft) return 'payrollPeriods.draft';
    if (status === PayrollPeriodStatus.Open) return 'payrollPeriods.open';
    return 'payrollPeriods.closed';
}

export function PayrollPeriodDetailsDialog({
    period,
    onClose,
}: PayrollPeriodDetailsDialogProps) {
    const { t } = useI18n();
    const details = [
        [t('payrollPeriods.code'), period.code],
        [t('payrollPeriods.name'), period.name],
        [t('payrollPeriods.month'), period.payrollMonth.toString()],
        [t('payrollPeriods.year'), period.payrollYear.toString()],
        [t('payrollPeriods.startDate'), formatDate(period.startDate)],
        [t('payrollPeriods.endDate'), formatDate(period.endDate)],
        [t('common.status'), t(statusKey(period.status))],
        [t('payrollPeriods.openedAt'), formatDateTime(period.openedAt)],
        [t('payrollPeriods.closedAt'), formatDateTime(period.closedAt)],
        [t('common.createdAt'), formatDateTime(period.createdAt)],
        [t('common.updatedAt'), formatDateTime(period.updatedAt)],
    ];

    return (
        <SideDrawer
            closeLabel={t('common.close')}
            subtitle={period.code}
            title={period.name}
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
