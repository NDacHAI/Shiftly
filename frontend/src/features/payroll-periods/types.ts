export enum PayrollPeriodStatus {
    Draft = 'DRAFT',
    Open = 'OPEN',
    Closed = 'CLOSED',
}

export type PayrollPeriod = {
    id: string;
    code: string;
    name: string;
    payrollMonth: number;
    payrollYear: number;
    startDate: string;
    endDate: string;
    status: PayrollPeriodStatus;
    openedAt: string | null;
    closedAt: string | null;
    createdById: number | null;
    createdAt: string;
    updatedAt: string;
};

export type PayrollPeriodPayload = {
    payrollMonth: number;
    payrollYear: number;
    startDate: string;
    endDate: string;
};

export type UpdatePayrollPeriodPayload = Partial<PayrollPeriodPayload>;

export type PayrollPeriodSortField =
    | 'code'
    | 'name'
    | 'payrollMonth'
    | 'payrollYear'
    | 'startDate'
    | 'endDate'
    | 'status'
    | 'createdAt';

export type SortOrder = 'ASC' | 'DESC';
export type PayrollPeriodStatusFilter = 'all' | 'draft' | 'open' | 'closed';

export type PayrollPeriodListResponse = {
    data: PayrollPeriod[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};
