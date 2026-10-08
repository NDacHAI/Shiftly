import { type AttendanceStatus } from '@/features/attendance/types';

export type DashboardRangeDays = 7 | 30 | 90;

export type DashboardBranchOption = {
    id: string;
    code: string;
    name: string;
};

export type DashboardDailyStats = {
    date: string;
    scheduled: number;
    onTime: number;
    late: number;
    working: number;
    absent: number;
    onLeave: number;
    notRecorded: number;
};

export type DashboardMissingCheckIn = {
    workScheduleId: string;
    employeeId: string;
    employeeCode: string;
    employeeName: string;
    branchName: string;
    shiftName: string;
    scheduledStartAt: string;
    minutesOverdue: number;
};

export type DashboardPendingLeaveRequest = {
    id: string;
    code: string;
    employeeName: string;
    branchName: string;
    requestMode: 'DATE_TIME' | 'SHIFT';
    startDate: string | null;
    endDate: string | null;
    isFullDay: boolean | null;
    startTime: string | null;
    endTime: string | null;
    createdAt: string;
};

export type DashboardPendingShiftRequest = {
    id: string;
    employeeName: string;
    branchName: string;
    shiftName: string;
    workDate: string;
    createdAt: string;
};

export type DashboardPendingAttendance = {
    id: string;
    employeeName: string;
    branchName: string;
    scheduleDate: string;
    checkInAt: string | null;
    checkOutAt: string | null;
    workedMinutes: number;
    lateMinutes: number;
};

export type DashboardBranchHours = {
    branchId: string;
    branchName: string;
    workedMinutes: number;
    overtimeMinutes: number;
};

export type DashboardPayrollTrend = {
    payrollPeriodId: string;
    name: string;
    month: number;
    year: number;
    employees: number;
    regularPay: number;
    overtimePay: number;
    holidayPay: number;
    rewardTotal: number;
    penaltyTotal: number;
    grossPay: number;
    netPay: number;
};

export type DashboardCurrentPayrollPeriod = {
    id: string;
    code: string;
    name: string;
    startDate: string;
    endDate: string;
    status: 'DRAFT' | 'OPEN' | 'CLOSED';
    daysRemaining: number;
    processingStatus:
        | 'DRAFT'
        | 'PROCESSING'
        | 'COMPLETED'
        | 'FAILED'
        | 'CLOSED'
        | null;
};

export type DashboardHoliday = {
    id: string;
    name: string;
    holidayDate: string;
};

export type DashboardEmployeeRanking = {
    employeeId: string;
    employeeCode: string;
    employeeName: string;
    count: number;
    minutes: number;
};

export type DashboardSummary = {
    generatedAt: string;
    date: string;
    range: {
        fromDate: string;
        toDate: string;
        days: number;
    };
    branchId: string | null;
    branches: DashboardBranchOption[];
    todayStats: DashboardDailyStats;
    pending: {
        leaveRequests: number;
        shiftRequests: number;
        attendanceConfirmations: number;
        total: number;
    };
    actionItems: {
        missingCheckIns: DashboardMissingCheckIn[];
        pendingLeaveRequests: DashboardPendingLeaveRequest[];
        pendingShiftRequests: DashboardPendingShiftRequest[];
        pendingAttendances: DashboardPendingAttendance[];
    };
    attendanceTrend: DashboardDailyStats[];
    branchHours: DashboardBranchHours[];
    payrollTrend: DashboardPayrollTrend[];
    currentPayrollPeriod: DashboardCurrentPayrollPeriod | null;
    upcomingHolidays: DashboardHoliday[];
    topLateEmployees: DashboardEmployeeRanking[];
    topOvertimeEmployees: DashboardEmployeeRanking[];
};

export type DashboardMySchedule = {
    workScheduleId: string;
    attendanceId: string | null;
    workDate: string;
    shiftName: string;
    branchName: string;
    positionName: string;
    scheduledStartAt: string;
    scheduledEndAt: string;
    checkInAt: string | null;
    checkOutAt: string | null;
    attendanceStatus: AttendanceStatus | null;
    isOnLeave: boolean;
};

export type DashboardMyRequest = {
    id: string;
    type: 'LEAVE' | 'SHIFT';
    label: string;
    date: string | null;
    // Leave requests use string statuses, shift requests use numeric ones (0-3).
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 0 | 1 | 2 | 3;
    createdAt: string;
};

export type DashboardMine = {
    generatedAt: string;
    date: string;
    employee: {
        id: string;
        employeeCode: string;
        fullName: string;
    };
    todaySchedules: DashboardMySchedule[];
    upcomingSchedules: DashboardMySchedule[];
    monthStats: {
        fromDate: string;
        toDate: string;
        scheduledShifts: number;
        attendedShifts: number;
        workedMinutes: number;
        overtimeMinutes: number;
        lateCount: number;
        lateMinutes: number;
        absentCount: number;
    };
    pendingRequests: {
        leaveRequests: number;
        shiftRequests: number;
    };
    recentRequests: DashboardMyRequest[];
    latestPayslip: {
        id: string;
        payrollPeriodName: string;
        grossPay: number;
        netPay: number;
        createdAt: string;
    } | null;
};
