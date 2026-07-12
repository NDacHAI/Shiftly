export enum RewardPenaltyCategory {
    Penalty = 0,
    Reward = 1,
}

export enum RewardPenaltyStatus {
    Inactive = 0,
    Active = 1,
}

export type RewardPenaltyCatalog = {
    id: string;
    code: string;
    name: string;
    category: RewardPenaltyCategory;
    amount: string;
    description: string | null;
    status: RewardPenaltyStatus;
    createdAt: string;
    updatedAt: string;
};

export type RewardPenaltyCatalogPayload = {
    code: string;
    name: string;
    category: RewardPenaltyCategory;
    amount: number;
    description?: string | null;
    status?: RewardPenaltyStatus;
};

export type UpdateRewardPenaltyCatalogPayload = {
    name?: string;
    category?: RewardPenaltyCategory;
    amount?: number;
    description?: string | null;
    status?: RewardPenaltyStatus;
};

export type RewardPenaltyCatalogSortField =
    | 'code'
    | 'name'
    | 'category'
    | 'amount'
    | 'status'
    | 'createdAt';
export type SortOrder = 'ASC' | 'DESC';
export type RewardPenaltyStatusFilter = 'all' | 'active' | 'inactive';
export type RewardPenaltyCategoryFilter = 'all' | 'reward' | 'penalty';

export type RewardPenaltyCatalogListResponse = {
    data: RewardPenaltyCatalog[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};
