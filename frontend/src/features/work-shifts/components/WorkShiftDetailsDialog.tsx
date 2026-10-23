import { DrawerDetails, SideDrawer } from '@/components/feedback';
import { useI18n } from '@/i18n';
import { type WorkShift, WorkShiftStatus } from '../types';

type WorkShiftDetailsDialogProps = {
    workShift: WorkShift;
    onClose: () => void;
};

function formatDate(value: string) {
    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(value));
}

function formatDuration(minutes: number) {
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;

    if (!hours) return `${remainder}m`;
    if (!remainder) return `${hours}h`;
    return `${hours}h ${remainder}m`;
}

export function WorkShiftDetailsDialog({
    workShift,
    onClose,
}: WorkShiftDetailsDialogProps) {
    const { t } = useI18n();
    const details = [
        [
            t('workShifts.timeRange'),
            `${workShift.startTime.slice(0, 5)} - ${workShift.endTime.slice(0, 5)}`,
        ],
        [
            t('workShifts.overnight'),
            workShift.isOvernight ? t('workShifts.yes') : t('workShifts.no'),
        ],
        [t('workShifts.breakMinutes'), `${workShift.breakMinutes}m`],
        [
            t('workShifts.workingDuration'),
            formatDuration(workShift.workingDurationMinutes),
        ],
        [t('common.description'), workShift.description || '-'],
        [
            t('common.status'),
            workShift.status === WorkShiftStatus.Active
                ? t('common.active')
                : t('common.inactive'),
        ],
        [t('common.createdAt'), formatDate(workShift.createdAt)],
        [t('common.updatedAt'), formatDate(workShift.updatedAt)],
    ];

    return (
        <SideDrawer
            closeLabel={t('common.close')}
            subtitle={workShift.code}
            title={workShift.name}
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
