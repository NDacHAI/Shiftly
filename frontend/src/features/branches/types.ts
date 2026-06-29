export type Branch = {
    id: string;
    code: string;
    name: string;
    description: string | null;
    status: boolean;
    createdAt: string;
    updatedAt: string;
};

export type BranchPayload = {
    code: string;
    name: string;
    description?: string;
    status: boolean;
};

export type UpdateBranchPayload = BranchPayload;

export type BranchSortField = 'code' | 'name' | 'status' | 'createdAt';
export type SortOrder = 'ASC' | 'DESC';

export type BranchListResponse = {
    data: Branch[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};
