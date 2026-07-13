import { type Branch } from '@/features/branches/types';
import { type Employee } from '@/features/employees/types';
import { type PayrollPeriod } from '@/features/payroll-periods/types';
import {
    type RewardPenaltyCatalog,
    RewardPenaltyCategory,
} from '@/features/reward-penalty-catalogs/types';

export { RewardPenaltyCategory };

export type PayrollAdjustment = {
    id: string;
    payrollPeriodId: string;
    payrollPeriod: PayrollPeriod;
    employeeId: string;
    employee: Employee;
    branchId: string;
    branch: Branch;
    catalogId: string;
    catalog: RewardPenaltyCatalog;
    catalogCode: string;
    catalogName: string;
    category: RewardPenaltyCategory;
    amount: string;
    reason: string;
    adjustmentDate: string;
    createdByUserId: number;
    createdAt: string;
    updatedAt: string;
};

export type PayrollAdjustmentPayload = {
    payrollPeriodId: string;
    employeeId: string;
    branchId: string;
    catalogId: string;
    amount: number;
    reason: string;
    adjustmentDate: string;
};

export type UpdatePayrollAdjustmentPayload = Partial<PayrollAdjustmentPayload>;

export type PayrollAdjustmentSortField =
    | 'adjustmentDate'
    | 'amount'
    | 'category'
    | 'createdAt';

export type SortOrder = 'ASC' | 'DESC';
export type PayrollAdjustmentCategoryFilter = 'all' | 'reward' | 'penalty';

export type PayrollAdjustmentListResponse = {
    data: PayrollAdjustment[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};
