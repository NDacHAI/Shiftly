import { type I18nKey } from '@/i18n';
import { getApiErrorKey, getApiErrorMessage } from '@/lib/api-error';
import { api } from '@/lib/axios';
import {
    type CancelShiftRequestPayload,
    type ReviewShiftRequestPayload,
    type ShiftRequest,
    type ShiftRequestListResponse,
    type ShiftRequestPayload,
    type ShiftRequestStatus,
} from '../types';

const baseShiftRequestApi = '/shift-requests';

export type ListShiftRequestsParams = {
    page: number;
    limit: number;
    status?: ShiftRequestStatus;
    branchId?: string;
    employeeId?: string;
    positionId?: string;
    workShiftId?: string;
    workDate?: string;
    fromDate?: string;
    toDate?: string;
    sortBy?: 'workDate' | 'createdAt' | 'updatedAt' | 'status';
    sortOrder?: 'ASC' | 'DESC';
};

export async function listShiftRequests(
    params: ListShiftRequestsParams,
): Promise<ShiftRequestListResponse> {
    const response = await api.get<ShiftRequestListResponse>(
        baseShiftRequestApi,
        { params },
    );
    return response.data;
}

export async function listMyShiftRequests(
    params: ListShiftRequestsParams,
): Promise<ShiftRequestListResponse> {
    const response = await api.get<ShiftRequestListResponse>(
        `${baseShiftRequestApi}/my`,
        { params },
    );
    return response.data;
}

export async function getShiftRequest(id: string): Promise<ShiftRequest> {
    const response = await api.get<ShiftRequest>(
        `${baseShiftRequestApi}/${id}`,
    );
    return response.data;
}

export async function createShiftRequest(
    payload: ShiftRequestPayload,
): Promise<ShiftRequest> {
    const response = await api.post<ShiftRequest>(
        baseShiftRequestApi,
        payload,
    );
    return response.data;
}

export async function approveShiftRequest(
    id: string,
    payload: ReviewShiftRequestPayload,
): Promise<ShiftRequest> {
    const response = await api.patch<ShiftRequest>(
        `${baseShiftRequestApi}/${id}/approve`,
        payload,
    );
    return response.data;
}

export async function rejectShiftRequest(
    id: string,
    payload: ReviewShiftRequestPayload,
): Promise<ShiftRequest> {
    const response = await api.patch<ShiftRequest>(
        `${baseShiftRequestApi}/${id}/reject`,
        payload,
    );
    return response.data;
}

export async function cancelShiftRequest(
    id: string,
    payload: CancelShiftRequestPayload,
): Promise<ShiftRequest> {
    const response = await api.patch<ShiftRequest>(
        `${baseShiftRequestApi}/${id}/cancel`,
        payload,
    );
    return response.data;
}

export function getShiftRequestErrorMessage(error: unknown): string {
    return getApiErrorMessage(
        error,
        'Could not process the shift request. Please try again.',
    );
}

export function getShiftRequestErrorKey(error: unknown): I18nKey {
    return getApiErrorKey(error);
}
