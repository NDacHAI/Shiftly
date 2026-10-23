import { DrawerDetails, SideDrawer } from '@/components/feedback';
import { useI18n } from '@/i18n';
import { type SalaryRule, SalaryRuleStatus } from '../types';

type SalaryRuleDetailsDialogProps = {
    salaryRule: SalaryRule;
    onClose: () => void;
};

function formatDateTime(value: string) {
    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(value));
}

export function SalaryRuleDetailsDialog({
    salaryRule,
    onClose,
}: SalaryRuleDetailsDialogProps) {
    const { t } = useI18n();
    const details = [
        [t('salaryRules.code'), salaryRule.code],
        [
            t('common.status'),
            salaryRule.status === SalaryRuleStatus.Active
                ? t('common.active')
                : t('common.inactive'),
        ],
        [
            t('salaryRules.currentMultiplier'),
            salaryRule.currentMultiplier ?? t('salaryRules.noCurrentVersion'),
        ],
        [t('salaryRules.note'), salaryRule.note || '-'],
        [t('common.createdAt'), formatDateTime(salaryRule.createdAt)],
        [t('common.updatedAt'), formatDateTime(salaryRule.updatedAt)],
    ];

    return (
        <SideDrawer
            closeLabel={t('common.close')}
            subtitle={salaryRule.code}
            title={salaryRule.name}
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
