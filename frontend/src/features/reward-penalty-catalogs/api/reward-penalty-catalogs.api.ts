import { type I18nKey } from '@/i18n';
import { getApiErrorKey, getApiErrorMessage } from '@/lib/api-error';
import { api } from '@/lib/axios';
import {
    type RewardPenaltyCatalog,
    type RewardPenaltyCatalogListResponse,
    type RewardPenaltyCatalogPayload,
    type RewardPenaltyCatalogSortField,
    type RewardPenaltyCategory,
    type RewardPenaltyStatus,
    type SortOrder,
    type UpdateRewardPenaltyCatalogPayload,
} from '../types';

const baseRewardPenaltyCatalogApi = '/reward-penalty-catalogs';

type ListRewardPenaltyCatalogsParams = {
    page: number;
    limit: number;
    search?: string;
    category?: RewardPenaltyCategory;
    status?: RewardPenaltyStatus;
    sortBy: RewardPenaltyCatalogSortField;
    sortOrder: SortOrder;
};

export async function listRewardPenaltyCatalogs(
    params: ListRewardPenaltyCatalogsParams,
): Promise<RewardPenaltyCatalogListResponse> {
    const response = await api.get<RewardPenaltyCatalogListResponse>(
        baseRewardPenaltyCatalogApi,
        { params },
    );
    return response.data;
}

export async function getRewardPenaltyCatalog(
    id: string,
): Promise<RewardPenaltyCatalog> {
    const response = await api.get<RewardPenaltyCatalog>(
        `${baseRewardPenaltyCatalogApi}/${id}`,
    );
    return response.data;
}

export async function createRewardPenaltyCatalog(
    payload: RewardPenaltyCatalogPayload,
): Promise<RewardPenaltyCatalog> {
    const response = await api.post<RewardPenaltyCatalog>(
        baseRewardPenaltyCatalogApi,
        payload,
    );
    return response.data;
}

export async function updateRewardPenaltyCatalog(
    id: string,
    payload: UpdateRewardPenaltyCatalogPayload,
): Promise<RewardPenaltyCatalog> {
    const response = await api.put<RewardPenaltyCatalog>(
        `${baseRewardPenaltyCatalogApi}/${id}`,
        payload,
    );
    return response.data;
}

export async function deleteRewardPenaltyCatalog(id: string): Promise<void> {
    await api.delete(`${baseRewardPenaltyCatalogApi}/${id}`);
}

export function getRewardPenaltyCatalogErrorMessage(error: unknown): string {
    return getApiErrorMessage(
        error,
        'Unable to process the reward penalty catalog request. Please try again.',
    );
}

export function getRewardPenaltyCatalogErrorKey(error: unknown): I18nKey {
    return getApiErrorKey(error);
}
