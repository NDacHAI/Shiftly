import { type Branch } from '@/features/branches/types';
import { type Employee } from '@/features/employees/types';
import { type WorkSchedule } from '@/features/work-schedules/types';

export enum LeaveRequestMode {
    DateTime = 'DATE_TIME',
    Shift = 'SHIFT',
}

export enum LeaveRequestStatus {
    Pending = 'PENDING',
    Approved = 'APPROVED',
    Rejected = 'REJECTED',
    Cancelled = 'CANCELLED',
}

export type LeaveRequestAssignment = {
    id: string;
    leaveRequestId: string;
    workScheduleId: string;
    workSchedule: WorkSchedule;
    createdAt: string;
    updatedAt: string;
};

export type LeaveRequest = {
    id: string;
    code: string;
    employeeId: string;
    employee: Employee;
    branchId: string;
    branch: Branch;
    requestMode: LeaveRequestMode;
    startDate: string | null;
    endDate: string | null;
    isFullDay: boolean | null;
    startTime: string | null;
    endTime: string | null;
    reason: string;
    status: LeaveRequestStatus;
    createdByUserId: number;
    reviewedByUserId: number | null;
    reviewNote: string | null;
    reviewedAt: string | null;
    cancelledByUserId: number | null;
    cancelReason: string | null;
    cancelledAt: string | null;
    assignments: LeaveRequestAssignment[];
    createdAt: string;
    updatedAt: string;
};

export type LeaveRequestPayload = {
    employeeId?: string;
    branchId: string;
    requestMode: LeaveRequestMode;
    startDate?: string;
    endDate?: string;
    isFullDay?: boolean;
    startTime?: string;
    endTime?: string;
    workScheduleIds?: string[];
    reason: string;
};

export type ReviewLeaveRequestPayload = {
    reviewNote: string;
};

export type CancelLeaveRequestPayload = {
    cancelReason: string;
};

export type LeaveRequestListResponse = {
    data: LeaveRequest[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

export type LeaveRequestStatusFilter =
    | 'all'
    | LeaveRequestStatus.Pending
    | LeaveRequestStatus.Approved
    | LeaveRequestStatus.Rejected
    | LeaveRequestStatus.Cancelled;
