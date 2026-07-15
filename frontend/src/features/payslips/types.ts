import { type EmployeePayroll } from '@/features/payroll-processings/types';

export type Payslip = EmployeePayroll;

export type PayslipSortField =
    | 'createdAt'
    | 'employeeCode'
    | 'employeeName'
    | 'grossPay'
    | 'netPay';

export type SortOrder = 'ASC' | 'DESC';

export type PayslipListResponse = {
    data: Payslip[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};
