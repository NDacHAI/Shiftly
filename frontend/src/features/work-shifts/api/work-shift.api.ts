import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import {
    type UpdateWorkShiftPayload,
    type WorkShift,
    type WorkShiftListResponse,
    type WorkShiftPayload,
    type WorkShiftStatus,
} from '../types';

const baseWorkShiftApi = '/work-shifts';

type ListWorkShiftParams = {
    page: number;
    limit: number;
    search?: string;
    status?: WorkShiftStatus;
};

export async function listWorkShifts(
    params: ListWorkShiftParams,
): Promise<WorkShiftListResponse> {
    const response = await api.get<WorkShiftListResponse>(baseWorkShiftApi, {
        params,
    });
    return response.data;
}

export async function getWorkShift(id: string): Promise<WorkShift> {
    const response = await api.get<WorkShift>(`${baseWorkShiftApi}/${id}`);
    return response.data;
}

export async function createWorkShift(
    payload: WorkShiftPayload,
): Promise<WorkShift> {
    const response = await api.post<WorkShift>(baseWorkShiftApi, payload);
    return response.data;
}

export async function updateWorkShift(
    id: string,
    payload: UpdateWorkShiftPayload,
): Promise<WorkShift> {
    const response = await api.put<WorkShift>(
        `${baseWorkShiftApi}/${id}`,
        payload,
    );
    return response.data;
}

export async function deleteWorkShift(id: string): Promise<void> {
    await api.delete(`${baseWorkShiftApi}/${id}`);
}

export function getWorkShiftErrorMessage(error: unknown): string {
    if (error instanceof AxiosError) {
        const data = error.response?.data as
            | { message?: string | string[] }
            | undefined;
        const message = data?.message;

        if (Array.isArray(message)) return message.join(', ');
        if (message) return message;
    }

    return 'Unable to process the request. Please try again.';
}
