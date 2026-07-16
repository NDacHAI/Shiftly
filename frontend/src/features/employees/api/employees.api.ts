import { type I18nKey } from '@/i18n';
import { getApiErrorKey, getApiErrorMessage } from '@/lib/api-error';
import { api } from '@/lib/axios';
import {
    type CreateEmployeeAccountPayload,
    type Employee,
    type EmployeeAccount,
    type EmployeeListResponse,
    type EmployeePayload,
    type EmployeeSortField,
    type EmployeeStatus,
    type ResetEmployeePasswordPayload,
    type SortOrder,
    type UpdateEmployeeAccountPayload,
    type UpdateEmployeePayload,
} from '../types';

type ListEmployeesParams = {
    page: number;
    limit: number;
    search?: string;
    branchId?: string;
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

export async function createEmployeeAccount(
    id: string,
    payload: CreateEmployeeAccountPayload,
): Promise<EmployeeAccount> {
    const response = await api.post<EmployeeAccount>(
        `/employees/${id}/account`,
        payload,
    );
    return response.data;
}

export async function getEmployeeAccount(
    id: string,
): Promise<EmployeeAccount | null> {
    const response = await api.get<EmployeeAccount | null>(
        `/employees/${id}/account`,
    );
    return response.data;
}

export async function updateEmployeeAccount(
    id: string,
    payload: UpdateEmployeeAccountPayload,
): Promise<EmployeeAccount> {
    const response = await api.put<EmployeeAccount>(
        `/employees/${id}/account`,
        payload,
    );
    return response.data;
}

export async function resetEmployeePassword(
    id: string,
    payload: ResetEmployeePasswordPayload,
): Promise<EmployeeAccount> {
    const response = await api.post<EmployeeAccount>(
        `/employees/${id}/account/reset-password`,
        payload,
    );
    return response.data;
}

export function getEmployeeErrorMessage(error: unknown): string {
    return getApiErrorMessage(
        error,
        'Could not process the employee request. Please try again.',
    );
}

export function getEmployeeErrorKey(error: unknown): I18nKey {
    return getApiErrorKey(error);
}
