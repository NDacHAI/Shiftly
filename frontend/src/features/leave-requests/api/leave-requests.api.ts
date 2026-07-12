import { getApiErrorMessage } from '@/lib/api-error';
import { api } from '@/lib/axios';
import {
    type CancelLeaveRequestPayload,
    type LeaveRequest,
    type LeaveRequestListResponse,
    type LeaveRequestMode,
    type LeaveRequestPayload,
    type LeaveRequestStatus,
    type ReviewLeaveRequestPayload,
} from '../types';

const baseLeaveRequestApi = '/leave-requests';

export type ListLeaveRequestsParams = {
    page: number;
    limit: number;
    status?: LeaveRequestStatus;
    requestMode?: LeaveRequestMode;
    branchId?: string;
    employeeId?: string;
    fromDate?: string;
    toDate?: string;
    sortBy?: 'startDate' | 'createdAt' | 'updatedAt' | 'status';
    sortOrder?: 'ASC' | 'DESC';
};

export async function listLeaveRequests(
    params: ListLeaveRequestsParams,
): Promise<LeaveRequestListResponse> {
    const response = await api.get<LeaveRequestListResponse>(
        baseLeaveRequestApi,
        { params },
    );
    return response.data;
}

export async function listMyLeaveRequests(
    params: ListLeaveRequestsParams,
): Promise<LeaveRequestListResponse> {
    const response = await api.get<LeaveRequestListResponse>(
        `${baseLeaveRequestApi}/my`,
        { params },
    );
    return response.data;
}

export async function createLeaveRequest(
    payload: LeaveRequestPayload,
): Promise<LeaveRequest> {
    const response = await api.post<LeaveRequest>(baseLeaveRequestApi, payload);
    return response.data;
}

export async function updateLeaveRequest(
    id: string,
    payload: Partial<LeaveRequestPayload>,
): Promise<LeaveRequest> {
    const response = await api.put<LeaveRequest>(
        `${baseLeaveRequestApi}/${id}`,
        payload,
    );
    return response.data;
}

export async function approveLeaveRequest(
    id: string,
    payload: ReviewLeaveRequestPayload,
): Promise<LeaveRequest> {
    const response = await api.patch<LeaveRequest>(
        `${baseLeaveRequestApi}/${id}/approve`,
        payload,
    );
    return response.data;
}

export async function rejectLeaveRequest(
    id: string,
    payload: ReviewLeaveRequestPayload,
): Promise<LeaveRequest> {
    const response = await api.patch<LeaveRequest>(
        `${baseLeaveRequestApi}/${id}/reject`,
        payload,
    );
    return response.data;
}

export async function cancelLeaveRequest(
    id: string,
    payload: CancelLeaveRequestPayload,
): Promise<LeaveRequest> {
    const response = await api.patch<LeaveRequest>(
        `${baseLeaveRequestApi}/${id}/cancel`,
        payload,
    );
    return response.data;
}

export function getLeaveRequestErrorMessage(error: unknown): string {
    return getApiErrorMessage(
        error,
        'Could not process the leave request. Please try again.',
    );
}
