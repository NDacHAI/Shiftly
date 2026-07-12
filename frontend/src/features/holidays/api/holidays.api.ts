import { getApiErrorMessage } from '@/lib/api-error';
import { api } from '@/lib/axios';
import {
    type Holiday,
    type HolidayCheckResponse,
    type HolidayListResponse,
    type HolidayPayload,
    type HolidaySortField,
    type HolidayStatus,
    type SortOrder,
    type UpdateHolidayPayload,
} from '../types';

const baseHolidayApi = '/holidays';

type ListHolidaysParams = {
    page: number;
    limit: number;
    search?: string;
    year?: number;
    status?: HolidayStatus;
    sortBy: HolidaySortField;
    sortOrder: SortOrder;
};

export async function listHolidays(
    params: ListHolidaysParams,
): Promise<HolidayListResponse> {
    const response = await api.get<HolidayListResponse>(baseHolidayApi, {
        params,
    });
    return response.data;
}

export async function getHoliday(id: string): Promise<Holiday> {
    const response = await api.get<Holiday>(`${baseHolidayApi}/${id}`);
    return response.data;
}

export async function checkHoliday(date: string): Promise<HolidayCheckResponse> {
    const response = await api.get<HolidayCheckResponse>(
        `${baseHolidayApi}/check`,
        {
            params: { date },
        },
    );
    return response.data;
}

export async function createHoliday(
    payload: HolidayPayload,
): Promise<Holiday> {
    const response = await api.post<Holiday>(baseHolidayApi, payload);
    return response.data;
}

export async function updateHoliday(
    id: string,
    payload: UpdateHolidayPayload,
): Promise<Holiday> {
    const response = await api.put<Holiday>(
        `${baseHolidayApi}/${id}`,
        payload,
    );
    return response.data;
}

export async function deleteHoliday(id: string): Promise<void> {
    await api.delete(`${baseHolidayApi}/${id}`);
}

export function getHolidayErrorMessage(error: unknown): string {
    return getApiErrorMessage(
        error,
        'Unable to process the holiday request. Please try again.',
    );
}
