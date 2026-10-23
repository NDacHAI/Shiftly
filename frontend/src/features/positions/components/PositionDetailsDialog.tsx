import { DrawerDetails, SideDrawer } from '@/components/feedback';
import { useI18n } from '@/i18n';
import { type Position } from '../types';

type PositionDetailsDialogProps = {
    position: Position;
    onClose: () => void;
};

function formatDate(value: string) {
    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(value));
}

function formatCurrency(value: string) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(Number(value));
}

export function PositionDetailsDialog({
    position,
    onClose,
}: PositionDetailsDialogProps) {
    const { t } = useI18n();
    const details = [
        [t('common.branch'), position.branch.name],
        [t('positions.hourlyRate'), formatCurrency(position.hourlyRate)],
        [t('common.description'), position.description || '-'],
        [
            t('common.status'),
            position.status ? t('common.active') : t('common.inactive'),
        ],
        [t('common.createdAt'), formatDate(position.createdAt)],
        [t('common.updatedAt'), formatDate(position.updatedAt)],
    ];

    return (
        <SideDrawer
            closeLabel={t('common.close')}
            subtitle={position.code}
            title={position.name}
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
