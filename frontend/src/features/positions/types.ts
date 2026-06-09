import { type Department } from '@/features/departments/types';

export type Position = {
    id: string;
    code: string;
    name: string;
    departmentId: string;
    department: Department;
    description: string | null;
    status: boolean;
    createdAt: string;
    updatedAt: string;
};

export type PositionPayload = {
    code: string;
    name: string;
    departmentId: string;
    description?: string;
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
