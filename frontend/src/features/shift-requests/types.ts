import { type Branch } from '@/features/branches/types';
import { type Employee } from '@/features/employees/types';
import { type Position } from '@/features/positions/types';
import { type WorkShift } from '@/features/work-shifts/types';

export enum ShiftRequestStatus {
    Pending = 0,
    Approved = 1,
    Rejected = 2,
    Cancelled = 3,
}

export type ShiftRequest = {
    id: string;
    employeeId: string;
    employee: Employee;
    branchId: string;
    branch: Branch;
    positionId: string;
    position: Position;
    workShiftId: string;
    workShift: WorkShift;
    workDate: string;
    status: ShiftRequestStatus;
    employeeNote: string | null;
    managerNote: string | null;
    reviewedById: number | null;
    reviewedAt: string | null;
    cancelledById: number | null;
    cancelledAt: string | null;
    createdAt: string;
    updatedAt: string;
};

export type ShiftRequestPayload = {
    branchId: string;
    positionId: string;
    workShiftId: string;
    workDate: string;
    employeeNote?: string;
};

export type ReviewShiftRequestPayload = {
    managerNote?: string;
};

export type CancelShiftRequestPayload = {
    note?: string;
};

export type ShiftRequestListResponse = {
    data: ShiftRequest[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

export type ShiftRequestStatusFilter =
    | 'all'
    | `${ShiftRequestStatus.Pending}`
    | `${ShiftRequestStatus.Approved}`
    | `${ShiftRequestStatus.Rejected}`
    | `${ShiftRequestStatus.Cancelled}`;
