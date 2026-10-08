import { AttendanceStatus } from '@/module/attendance/entities/attendance-status.enum';
import { LeaveRequestMode } from '@/module/leave-request/entities/leave-request-mode.enum';
import { LeaveRequestStatus } from '@/module/leave-request/entities/leave-request-status.enum';
import { PayrollPeriodStatus } from '@/module/payroll-period/entities/payroll-period-status.enum';
import { PayrollProcessingStatus } from '@/module/payroll-processing/entities/payroll-processing-status.enum';
import { ShiftRequestStatus } from '@/module/shift-request/entities/shift-request-status.enum';

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

export type DashboardPendingCounts = {
    leaveRequests: number;
    shiftRequests: number;
    attendanceConfirmations: number;
    total: number;
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
    requestMode: LeaveRequestMode;
    startDate: string | null;
    endDate: string | null;
    isFullDay: boolean | null;
    startTime: string | null;
    endTime: string | null;
    createdAt: Date;
};

export type DashboardPendingShiftRequest = {
    id: string;
    employeeName: string;
    branchName: string;
    shiftName: string;
    workDate: string;
    createdAt: Date;
};

export type DashboardPendingAttendance = {
    id: string;
    employeeName: string;
    branchName: string;
    scheduleDate: string;
    checkInAt: Date | null;
    checkOutAt: Date | null;
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
    status: PayrollPeriodStatus;
    daysRemaining: number;
    processingStatus: PayrollProcessingStatus | null;
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
    pending: DashboardPendingCounts;
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
    checkInAt: Date | null;
    checkOutAt: Date | null;
    attendanceStatus: AttendanceStatus | null;
    isOnLeave: boolean;
};

export type DashboardMyRequest = {
    id: string;
    type: 'LEAVE' | 'SHIFT';
    label: string;
    date: string | null;
    status: LeaveRequestStatus | ShiftRequestStatus;
    createdAt: Date;
};

export type DashboardMyPayslip = {
    id: string;
    payrollPeriodName: string;
    grossPay: number;
    netPay: number;
    createdAt: Date;
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
    latestPayslip: DashboardMyPayslip | null;
};
