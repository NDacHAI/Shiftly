import { type Branch } from '@/features/branches/types';
import { type Employee } from '@/features/employees/types';
import { type Position } from '@/features/positions/types';
import { type WorkShift } from '@/features/work-shifts/types';

export type WorkSchedule = {
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
    shiftCodeSnapshot: string;
    shiftNameSnapshot: string;
    startTimeSnapshot: string;
    endTimeSnapshot: string;
    breakMinutesSnapshot: number;
    note: string | null;
    createdAt: string;
    updatedAt: string;
    workingDurationMinutes: number;
    isOvernight: boolean;
};

export type WorkSchedulePayload = {
    employeeId: string;
    branchId: string;
    positionId: string;
    workShiftId: string;
    workDate: string;
    note?: string;
};

export type UpdateWorkSchedulePayload = {
    branchId?: string;
    positionId?: string;
    workShiftId?: string;
    workDate?: string;
    note?: string;
};

export type WorkScheduleListResponse = {
    data: WorkSchedule[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

export type WorkScheduleViewMode = 'day' | 'week' | 'month';

export type WorkScheduleConflictStrategy = 'SKIP' | 'REPLACE';

export type BulkWorkSchedulePayload = {
    employeeIds: string[];
    branchId: string;
    positionId: string;
    workShiftId: string;
    startDate: string;
    endDate: string;
    weekdays?: number[];
    conflictStrategy: WorkScheduleConflictStrategy;
    note?: string;
};

export type BulkWorkScheduleResult = {
    createdCount: number;
    skippedCount: number;
    failedCount: number;
    replacedCount: number;
    items: Array<{
        employeeId: string;
        workDate: string;
        status: 'CREATED' | 'SKIPPED' | 'FAILED' | 'REPLACED';
        reason?: string;
        scheduleId?: string;
    }>;
};
