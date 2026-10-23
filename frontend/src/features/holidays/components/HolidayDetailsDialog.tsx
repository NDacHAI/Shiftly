import { DrawerDetails, SideDrawer } from '@/components/feedback';
import { useI18n } from '@/i18n';
import { type Holiday, HolidayStatus } from '../types';

type HolidayDetailsDialogProps = {
    holiday: Holiday;
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

export function HolidayDetailsDialog({
    holiday,
    onClose,
}: HolidayDetailsDialogProps) {
    const { t } = useI18n();
    const details = [
        [t('holidays.holidayDate'), formatDate(holiday.holidayDate)],
        [
            t('common.status'),
            holiday.status === HolidayStatus.Active
                ? t('common.active')
                : t('common.inactive'),
        ],
        [t('common.description'), holiday.description || '-'],
        [t('common.createdAt'), formatDateTime(holiday.createdAt)],
        [t('common.updatedAt'), formatDateTime(holiday.updatedAt)],
    ];

    return (
        <SideDrawer
            closeLabel={t('common.close')}
            subtitle={formatDate(holiday.holidayDate)}
            title={holiday.name}
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
