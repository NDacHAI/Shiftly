import { type Branch } from '@/features/branches/types';
import { type Employee } from '@/features/employees/types';
import { type PayrollPeriod } from '@/features/payroll-periods/types';
import { type Position } from '@/features/positions/types';

export enum PayrollProcessingStatus {
    Draft = 'DRAFT',
    Processing = 'PROCESSING',
    Completed = 'COMPLETED',
    Failed = 'FAILED',
    Closed = 'CLOSED',
}

export enum EmployeePayrollStatus {
    Success = 'SUCCESS',
    Failed = 'FAILED',
    Finalized = 'FINALIZED',
}

export type PayrollProcessing = {
    id: string;
    payrollPeriodId: string;
    payrollPeriod: PayrollPeriod;
    status: PayrollProcessingStatus;
    totalEmployees: number;
    processedEmployees: number;
    successCount: number;
    failedCount: number;
    generatedAt: string | null;
    generatedByUserId: number | null;
    closedAt: string | null;
    closedByUserId: number | null;
    errorMessage: string | null;
    createdAt: string;
    updatedAt: string;
};

export type EmployeePayroll = {
    id: string;
    payrollProcessingId: string;
    payrollPeriodId: string;
    payrollPeriod: PayrollPeriod;
    employeeId: string;
    employee?: Employee;
    branchId: string;
    branch?: Branch;
    positionId: string;
    position?: Position;
    employeeCode: string;
    employeeName: string;
    branchName: string;
    positionName: string;
    hourlyRate: string;
    regularMultiplier: string;
    overtimeMultiplier: string;
    holidayMultiplier: string;
    holidayOvertimeMultiplier: string;
    workedMinutes: number;
    overtimeMinutes: number;
    holidayMinutes: number;
    holidayOvertimeMinutes: number;
    rewardTotal: string;
    penaltyTotal: string;
    regularPay: string;
    overtimePay: string;
    holidayPay: string;
    holidayOvertimePay: string;
    grossPay: string;
    netPay: string;
    status: EmployeePayrollStatus;
    errorMessage: string | null;
    createdAt: string;
    updatedAt: string;
};

export type PayrollProcessingSortField =
    | 'createdAt'
    | 'generatedAt'
    | 'status'
    | 'totalEmployees'
    | 'processedEmployees'
    | 'successCount'
    | 'failedCount';

export type EmployeePayrollSortField =
    | 'createdAt'
    | 'employeeCode'
    | 'employeeName'
    | 'grossPay'
    | 'netPay'
    | 'status';

export type SortOrder = 'ASC' | 'DESC';
export type PayrollProcessingStatusFilter =
    | 'all'
    | 'draft'
    | 'processing'
    | 'completed'
    | 'failed'
    | 'closed';
export type EmployeePayrollStatusFilter =
    | 'all'
    | 'success'
    | 'failed'
    | 'finalized';

export type PayrollProcessingListResponse = {
    data: PayrollProcessing[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

export type EmployeePayrollListResponse = {
    data: EmployeePayroll[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};
