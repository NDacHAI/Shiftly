import { type WorkSchedule } from '@/features/work-schedules/types';

export type AttendanceStatus =
    | 'CHECKED_IN'
    | 'PENDING_CONFIRMATION'
    | 'CONFIRMED'
    | 'ABSENT';

export type AttendanceDisplayStatus = AttendanceStatus | 'NOT_CHECKED_IN';

export type AttendanceSource =
    | 'EMPLOYEE_CHECK_IN'
    | 'MANUAL'
    | 'MARK_ABSENT';

export type Attendance = {
    id: string;
    workScheduleId: string;
    employeeId: string;
    branchId: string;
    positionId: string;
    workShiftId: string;
    scheduleDate: string;
    scheduledStartAt: string;
    scheduledEndAt: string;
    checkInAt: string | null;
    checkOutAt: string | null;
    lateMinutes: number;
    earlyLeaveMinutes: number;
    overtimeMinutes: number;
    workedMinutes: number;
    status: AttendanceStatus;
    source: AttendanceSource;
    absenceReason: string | null;
    note: string | null;
    confirmedById: number | null;
    confirmedAt: string | null;
    workSchedule?: WorkSchedule;
};

export type AttendanceListItem = {
    workScheduleId: string;
    attendanceId: string | null;
    employeeId: string;
    branchId: string;
    positionId: string;
    workShiftId: string;
    scheduleDate: string;
    scheduledStartAt: string;
    scheduledEndAt: string;
    checkInAt: string | null;
    checkOutAt: string | null;
    lateMinutes: number;
    earlyLeaveMinutes: number;
    overtimeMinutes: number;
    workedMinutes: number;
    status: AttendanceStatus | null;
    displayStatus: AttendanceDisplayStatus;
    source: AttendanceSource | null;
    isLate: boolean;
    isEarlyLeave: boolean;
    isOvertime: boolean;
    hasAdjustment: boolean;
    workSchedule: WorkSchedule;
};

export type AttendanceListResponse = {
    data: AttendanceListItem[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

export type ManualAttendancePayload = {
    checkInAt: string;
    checkOutAt?: string;
    reason: string;
    note?: string;
};

export type AdjustAttendancePayload = {
    checkInAt?: string;
    checkOutAt?: string;
    reason: string;
    note?: string;
};

export type MarkAbsentPayload = {
    reason: string;
    note?: string;
};
