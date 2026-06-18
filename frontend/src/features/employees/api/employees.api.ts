import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import {
    type Employee,
    type EmployeeListResponse,
    type EmployeePayload,
    type EmployeeSortField,
    type EmployeeStatus,
    type SortOrder,
    type UpdateEmployeePayload,
} from '../types';

type ListEmployeesParams = {
    page: number;
    limit: number;
    search?: string;
    departmentId?: string;
    positionId?: string;
    status?: EmployeeStatus;
    sortBy: EmployeeSortField;
    sortOrder: SortOrder;
};

export async function listEmployees(
    params: ListEmployeesParams,
): Promise<EmployeeListResponse> {
    const response = await api.get<EmployeeListResponse>('/employees', {
        params,
    });
    return response.data;
}

export async function getEmployee(id: string): Promise<Employee> {
    const response = await api.get<Employee>(`/employees/${id}`);
    return response.data;
}

export async function getMyEmployee(): Promise<Employee> {
    const response = await api.get<Employee>('/employees/me');
    return response.data;
}

export async function createEmployee(
    payload: EmployeePayload,
): Promise<Employee> {
    const response = await api.post<Employee>('/employees', payload);
    return response.data;
}

export async function updateEmployee(
    id: string,
    payload: UpdateEmployeePayload,
): Promise<Employee> {
    const response = await api.put<Employee>(`/employees/${id}`, payload);
    return response.data;
}

export async function deleteEmployee(id: string): Promise<void> {
    await api.delete(`/employees/${id}`);
}

export function getEmployeeErrorMessage(error: unknown): string {
    if (error instanceof AxiosError) {
        const data = error.response?.data as
            | { message?: string | string[] }
            | undefined;
        const message = data?.message;

        if (Array.isArray(message)) return message.join(', ');
        if (message) return message;
    }

    return 'Could not process the employee request. Please try again.';
}
