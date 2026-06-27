import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@/components/ui';
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
        <div className="dialog-backdrop fixed inset-0 z-40 flex items-center justify-center bg-slate-950/55 p-5">
            <div
                aria-modal="true"
                className="dialog-panel w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl"
                role="dialog"
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold tracking-wider text-primary-600 uppercase">
                            {workShift.code}
                        </p>
                        <h2 className="mt-1 text-xl font-bold text-slate-950">
                            {workShift.name}
                        </h2>
                    </div>
                    <Button
                        aria-label={t('common.close')}
                        onClick={onClose}
                        size="icon"
                        variant="ghost"
                    >
                        <FontAwesomeIcon icon={faXmark} />
                    </Button>
                </div>
                <dl className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
                    {details.map(([label, value]) => (
                        <div className="grid gap-1 py-4" key={label}>
                            <dt className="text-xs font-semibold text-slate-500">
                                {label}
                            </dt>
                            <dd className="text-sm text-slate-800">{value}</dd>
                        </div>
                    ))}
                </dl>
            </div>
        </div>
    );
}
