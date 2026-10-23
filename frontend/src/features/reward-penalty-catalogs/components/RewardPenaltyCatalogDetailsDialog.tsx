import { DrawerDetails, SideDrawer } from '@/components/feedback';
import { useI18n } from '@/i18n';
import {
    type RewardPenaltyCatalog,
    RewardPenaltyCategory,
    RewardPenaltyStatus,
} from '../types';

type RewardPenaltyCatalogDetailsDialogProps = {
    catalog: RewardPenaltyCatalog;
    onClose: () => void;
};

function formatDateTime(value: string) {
    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(value));
}

function formatAmount(value: string) {
    return new Intl.NumberFormat('vi-VN').format(Number(value));
}

export function RewardPenaltyCatalogDetailsDialog({
    catalog,
    onClose,
}: RewardPenaltyCatalogDetailsDialogProps) {
    const { t } = useI18n();
    const details = [
        [t('rewardPenaltyCatalogs.code'), catalog.code],
        [
            t('rewardPenaltyCatalogs.category'),
            catalog.category === RewardPenaltyCategory.Reward
                ? t('rewardPenaltyCatalogs.reward')
                : t('rewardPenaltyCatalogs.penalty'),
        ],
        [t('rewardPenaltyCatalogs.amount'), formatAmount(catalog.amount)],
        [
            t('common.status'),
            catalog.status === RewardPenaltyStatus.Active
                ? t('common.active')
                : t('common.inactive'),
        ],
        [t('rewardPenaltyCatalogs.description'), catalog.description || '-'],
        [t('common.createdAt'), formatDateTime(catalog.createdAt)],
        [t('common.updatedAt'), formatDateTime(catalog.updatedAt)],
    ];

    return (
        <SideDrawer
            closeLabel={t('common.close')}
            subtitle={catalog.code}
            title={catalog.name}
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
