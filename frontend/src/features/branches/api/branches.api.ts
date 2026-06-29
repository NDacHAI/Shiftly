import { getApiErrorMessage } from '@/lib/api-error';
import { api } from '@/lib/axios';
import {
    type Branch,
    type BranchListResponse,
    type BranchPayload,
    type BranchSortField,
    type SortOrder,
    type UpdateBranchPayload,
} from '../types';

type ListBranchesParams = {
    page: number;
    limit: number;
    search?: string;
    sortBy: BranchSortField;
    sortOrder: SortOrder;
};

export async function listBranches(
    params: ListBranchesParams,
): Promise<BranchListResponse> {
    const response = await api.get<BranchListResponse>('/branches', {
        params,
    });
    return response.data;
}

export async function getBranch(id: string): Promise<Branch> {
    const response = await api.get<Branch>(`/branches/${id}`);
    return response.data;
}

export async function createBranch(
    payload: BranchPayload,
): Promise<Branch> {
    const response = await api.post<Branch>('/branches', payload);
    return response.data;
}

export async function updateBranch(
    id: string,
    payload: UpdateBranchPayload,
): Promise<Branch> {
    const response = await api.put<Branch>(
        `/branches/${id}`,
        payload,
    );
    return response.data;
}

export async function deleteBranch(id: string): Promise<void> {
    await api.delete(`/branches/${id}`);
}

export function getBranchErrorMessage(error: unknown): string {
    return getApiErrorMessage(error);
}
