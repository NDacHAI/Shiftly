import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowRightFromBracket,
    faArrowRightToBracket,
} from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui';
import { type I18nKey, useI18n } from '@/i18n';
import { formatShortDate, formatTime } from '../lib/format';
import { type DashboardMySchedule } from '../types';

type MyShiftListProps = {
    schedules: DashboardMySchedule[];
    showDate?: boolean;
    processingId?: string | null;
    onCheckIn?: (schedule: DashboardMySchedule) => void;
    onCheckOut?: (schedule: DashboardMySchedule) => void;
};

type ShiftState = {
    labelKey: I18nKey;
    className: string;
};

function getShiftState(schedule: DashboardMySchedule): ShiftState {
    if (schedule.isOnLeave && !schedule.attendanceStatus) {
        return {
            labelKey: 'dashboard.myShift.onLeave',
            className: 'bg-sky-50 text-sky-700',
        };
    }

    switch (schedule.attendanceStatus) {
        case 'CHECKED_IN':
            return {
                labelKey: 'attendance.status.checkedIn',
                className: 'bg-emerald-50 text-emerald-700',
            };
        case 'PENDING_CONFIRMATION':
            return {
                labelKey: 'attendance.status.pendingConfirmation',
                className: 'bg-amber-50 text-amber-700',
            };
        case 'CONFIRMED':
            return {
                labelKey: 'attendance.status.confirmed',
                className: 'bg-primary-50 text-primary-700',
            };
        case 'ABSENT':
            return {
                labelKey: 'attendance.status.absent',
                className: 'bg-red-50 text-red-700',
            };
        default:
            return {
                labelKey: 'attendance.status.notCheckedIn',
                className: 'bg-slate-100 text-slate-600',
            };
    }
}

export function MyShiftList({
    schedules,
    showDate = false,
    processingId = null,
    onCheckIn,
    onCheckOut,
}: MyShiftListProps) {
    const { language, t } = useI18n();

    return (
        <ul className="grid gap-3">
            {schedules.map((schedule) => {
                const state = getShiftState(schedule);
                const canCheckIn =
                    onCheckIn && !schedule.attendanceStatus && !schedule.isOnLeave;
                const canCheckOut =
                    onCheckOut && schedule.attendanceStatus === 'CHECKED_IN';

                return (
                    <li
                        className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 px-4 py-3 max-sm:flex-col max-sm:items-stretch"
                        key={schedule.workScheduleId}
                    >
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900">
                                {showDate &&
                                    `${formatShortDate(schedule.workDate, language)} · `}
                                {schedule.shiftName}{' '}
                                <span className="font-normal text-slate-500">
                                    ({formatTime(schedule.scheduledStartAt, language)} -{' '}
                                    {formatTime(schedule.scheduledEndAt, language)})
                                </span>
                            </p>
                            <p className="truncate text-xs text-slate-500">
                                {schedule.branchName} · {schedule.positionName}
                                {schedule.checkInAt &&
                                    ` · ${t('attendance.checkIn')} ${formatTime(schedule.checkInAt, language)}`}
                                {schedule.checkOutAt &&
                                    ` · ${t('attendance.checkOut')} ${formatTime(schedule.checkOutAt, language)}`}
                            </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${state.className}`}
                            >
                                {t(state.labelKey)}
                            </span>
                            {canCheckIn && (
                                <Button
                                    loading={processingId === schedule.workScheduleId}
                                    loadingLabel={t('common.loadingSave')}
                                    size="sm"
                                    onClick={() => onCheckIn(schedule)}
                                >
                                    <FontAwesomeIcon icon={faArrowRightToBracket} />
                                    {t('attendance.checkIn')}
                                </Button>
                            )}
                            {canCheckOut && (
                                <Button
                                    loading={processingId === schedule.workScheduleId}
                                    loadingLabel={t('common.loadingSave')}
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => onCheckOut(schedule)}
                                >
                                    <FontAwesomeIcon icon={faArrowRightFromBracket} />
                                    {t('attendance.checkOut')}
                                </Button>
                            )}
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
