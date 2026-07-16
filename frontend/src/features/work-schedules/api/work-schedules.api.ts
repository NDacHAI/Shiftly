import { type I18nKey } from '@/i18n';
import { getApiErrorKey, getApiErrorMessage } from '@/lib/api-error';
import { api } from '@/lib/axios';
import {
    type BulkWorkSchedulePayload,
    type BulkWorkScheduleResult,
    type UpdateWorkSchedulePayload,
    type WorkSchedule,
    type WorkScheduleListResponse,
    type WorkSchedulePayload,
} from '../types';

const baseWorkScheduleApi = '/work-schedules';

export type ListWorkSchedulesParams = {
    page: number;
    limit: number;
    fromDate?: string;
    toDate?: string;
    branchId?: string;
    positionId?: string;
    employeeId?: string;
    workShiftId?: string;
    search?: string;
    sortBy?: 'workDate' | 'createdAt' | 'employeeCode';
    sortOrder?: 'ASC' | 'DESC';
};

export async function listWorkSchedules(
    params: ListWorkSchedulesParams,
): Promise<WorkScheduleListResponse> {
    const response = await api.get<WorkScheduleListResponse>(
        baseWorkScheduleApi,
        { params },
    );
    return response.data;
}

export async function listWorkScheduleCalendar(
    params: ListWorkSchedulesParams,
): Promise<WorkScheduleListResponse> {
    const response = await api.get<WorkScheduleListResponse>(
        `${baseWorkScheduleApi}/calendar`,
        { params },
    );
    return response.data;
}

export async function listMyWorkSchedules(
    params: ListWorkSchedulesParams,
): Promise<WorkScheduleListResponse> {
    const response = await api.get<WorkScheduleListResponse>(
        `${baseWorkScheduleApi}/my-schedules`,
        { params },
    );
    return response.data;
}

export async function getWorkSchedule(id: string): Promise<WorkSchedule> {
    const response = await api.get<WorkSchedule>(`${baseWorkScheduleApi}/${id}`);
    return response.data;
}

export async function createWorkSchedule(
    payload: WorkSchedulePayload,
): Promise<WorkSchedule> {
    const response = await api.post<WorkSchedule>(
        baseWorkScheduleApi,
        payload,
    );
    return response.data;
}

export async function updateWorkSchedule(
    id: string,
    payload: UpdateWorkSchedulePayload,
): Promise<WorkSchedule> {
    const response = await api.put<WorkSchedule>(
        `${baseWorkScheduleApi}/${id}`,
        payload,
    );
    return response.data;
}

export async function deleteWorkSchedule(id: string): Promise<void> {
    await api.delete(`${baseWorkScheduleApi}/${id}`);
}

export async function bulkCreateWorkSchedules(
    payload: BulkWorkSchedulePayload,
): Promise<BulkWorkScheduleResult> {
    const response = await api.post<BulkWorkScheduleResult>(
        `${baseWorkScheduleApi}/bulk`,
        payload,
    );
    return response.data;
}

export function getWorkScheduleErrorMessage(error: unknown): string {
    return getApiErrorMessage(
        error,
        'Could not process the schedule request. Please try again.',
    );
}

export function getWorkScheduleErrorKey(error: unknown): I18nKey {
    return getApiErrorKey(error);
}
