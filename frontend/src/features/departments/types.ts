export type Department = {
    id: string;
    code: string;
    name: string;
    description: string | null;
    status: boolean;
    createdAt: string;
    updatedAt: string;
};

export type DepartmentPayload = {
    code: string;
    name: string;
    description?: string;
    status: boolean;
};

export type UpdateDepartmentPayload = Omit<DepartmentPayload, 'code'>;

export type DepartmentSortField = 'code' | 'name' | 'status' | 'createdAt';
export type SortOrder = 'ASC' | 'DESC';

export type DepartmentListResponse = {
    data: Department[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};
