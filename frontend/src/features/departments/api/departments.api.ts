import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import {
    type Department,
    type DepartmentListResponse,
    type DepartmentPayload,
    type DepartmentSortField,
    type SortOrder,
    type UpdateDepartmentPayload,
} from '../types';

type ListDepartmentsParams = {
    page: number;
    limit: number;
    search?: string;
    sortBy: DepartmentSortField;
    sortOrder: SortOrder;
};

export async function listDepartments(
    params: ListDepartmentsParams,
): Promise<DepartmentListResponse> {
    const response = await api.get<DepartmentListResponse>('/departments', {
        params,
    });
    return response.data;
}

export async function getDepartment(id: string): Promise<Department> {
    const response = await api.get<Department>(`/departments/${id}`);
    return response.data;
}

export async function createDepartment(
    payload: DepartmentPayload,
): Promise<Department> {
    const response = await api.post<Department>('/departments', payload);
    return response.data;
}

export async function updateDepartment(
    id: string,
    payload: UpdateDepartmentPayload,
): Promise<Department> {
    const response = await api.put<Department>(
        `/departments/${id}`,
        payload,
    );
    return response.data;
}

export async function deleteDepartment(id: string): Promise<void> {
    await api.delete(`/departments/${id}`);
}

export function getDepartmentErrorMessage(error: unknown): string {
    if (error instanceof AxiosError) {
        const data = error.response?.data as
            | { message?: string | string[] }
            | undefined;
        const message = data?.message;

        if (Array.isArray(message)) {
            return message.join(', ');
        }

        if (message) {
            return message;
        }
    }

    return 'Không thể xử lý yêu cầu. Vui lòng thử lại.';
}
