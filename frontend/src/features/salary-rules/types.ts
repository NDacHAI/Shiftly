export enum SalaryRuleStatus {
    Inactive = 0,
    Active = 1,
}

export type SalaryRule = {
    id: string;
    code: string;
    name: string;
    status: SalaryRuleStatus;
    isDefault: boolean;
    currentMultiplier: string | null;
    note: string | null;
    createdAt: string;
    updatedAt: string;
};

export type SalaryRulePayload = {
    code: string;
    name: string;
    multiplier: number;
    note?: string | null;
    status?: SalaryRuleStatus;
};

export type UpdateSalaryRulePayload = {
    name?: string;
    multiplier?: number;
    note?: string | null;
    status?: SalaryRuleStatus;
};

export type SalaryRuleSortField = 'code' | 'name' | 'status' | 'createdAt';
export type SortOrder = 'ASC' | 'DESC';
export type SalaryRuleStatusFilter = 'all' | 'active' | 'inactive';

export type SalaryRuleListResponse = {
    data: SalaryRule[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};
