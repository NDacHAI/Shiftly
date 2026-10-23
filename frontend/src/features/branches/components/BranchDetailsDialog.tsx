import { DrawerDetails, SideDrawer } from '@/components/feedback';
import { useI18n } from '@/i18n';
import { type Branch } from '../types';

type BranchDetailsDialogProps = {
    branch: Branch;
    onClose: () => void;
};

function formatDate(value: string) {
    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(value));
}

export function BranchDetailsDialog({
    branch,
    onClose,
}: BranchDetailsDialogProps) {
    const { t } = useI18n();
    const details = [
        [t('common.description'), branch.description || '-'],
        [
            t('common.status'),
            branch.status ? t('common.active') : t('common.inactive'),
        ],
        [t('common.createdAt'), formatDate(branch.createdAt)],
        [t('common.updatedAt'), formatDate(branch.updatedAt)],
    ];

    return (
        <SideDrawer
            closeLabel={t('common.close')}
            subtitle={branch.code}
            title={branch.name}
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
