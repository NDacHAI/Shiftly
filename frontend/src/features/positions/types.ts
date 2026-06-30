import { type Branch } from '@/features/branches/types';

export type Position = {
    id: string;
    code: string;
    name: string;
    branchId: string;
    branch: Branch;
    description: string | null;
    hourlyRate: string;
    status: boolean;
    createdAt: string;
    updatedAt: string;
};

export type PositionPayload = {
    code: string;
    name: string;
    branchId: string;
    description?: string;
    hourlyRate?: number;
    status: boolean;
};

export type UpdatePositionPayload = Omit<PositionPayload, 'code'>;
export type PositionSortField = 'name' | 'createdAt';
export type SortOrder = 'ASC' | 'DESC';

export type PositionListResponse = {
    data: Position[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};
