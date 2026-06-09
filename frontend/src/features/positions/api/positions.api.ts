import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import {
    type Position,
    type PositionListResponse,
    type PositionPayload,
    type PositionSortField,
    type SortOrder,
    type UpdatePositionPayload,
} from '../types';

type ListPositionsParams = {
    page: number;
    limit: number;
    search?: string;
    departmentId?: string;
    status?: boolean;
    sortBy: PositionSortField;
    sortOrder: SortOrder;
};

export async function listPositions(
    params: ListPositionsParams,
): Promise<PositionListResponse> {
    const response = await api.get<PositionListResponse>('/positions', {
        params,
    });
    return response.data;
}

export async function getPosition(id: string): Promise<Position> {
    const response = await api.get<Position>(`/positions/${id}`);
    return response.data;
}

export async function createPosition(
    payload: PositionPayload,
): Promise<Position> {
    const response = await api.post<Position>('/positions', payload);
    return response.data;
}

export async function updatePosition(
    id: string,
    payload: UpdatePositionPayload,
): Promise<Position> {
    const response = await api.put<Position>(`/positions/${id}`, payload);
    return response.data;
}

export async function updatePositionStatus(
    id: string,
    status: boolean,
): Promise<Position> {
    const response = await api.patch<Position>(`/positions/${id}/status`, {
        status,
    });
    return response.data;
}

export async function deletePosition(id: string): Promise<void> {
    await api.delete(`/positions/${id}`);
}

export function getPositionErrorMessage(error: unknown): string {
    if (error instanceof AxiosError) {
        const data = error.response?.data as
            | { message?: string | string[] }
            | undefined;
        const message = data?.message;

        if (Array.isArray(message)) return message.join(', ');
        if (message) return message;
    }

    return 'Không thể xử lý yêu cầu. Vui lòng thử lại.';
}
