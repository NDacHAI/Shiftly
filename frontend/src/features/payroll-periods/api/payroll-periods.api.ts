import { getApiErrorMessage } from '@/lib/api-error';
import { api } from '@/lib/axios';
import {
    type PayrollPeriod,
    type PayrollPeriodListResponse,
    type PayrollPeriodPayload,
    type PayrollPeriodSortField,
    type PayrollPeriodStatus,
    type SortOrder,
    type UpdatePayrollPeriodPayload,
} from '../types';

const basePayrollPeriodApi = '/payroll-periods';

type ListPayrollPeriodsParams = {
    page: number;
    limit: number;
    search?: string;
    status?: PayrollPeriodStatus;
    payrollMonth?: number;
    payrollYear?: number;
    sortBy: PayrollPeriodSortField;
    sortOrder: SortOrder;
};

export async function listPayrollPeriods(
    params: ListPayrollPeriodsParams,
): Promise<PayrollPeriodListResponse> {
    const response = await api.get<PayrollPeriodListResponse>(
        basePayrollPeriodApi,
        { params },
    );
    return response.data;
}

export async function getPayrollPeriod(id: string): Promise<PayrollPeriod> {
    const response = await api.get<PayrollPeriod>(`${basePayrollPeriodApi}/${id}`);
    return response.data;
}

export async function createPayrollPeriod(
    payload: PayrollPeriodPayload,
): Promise<PayrollPeriod> {
    const response = await api.post<PayrollPeriod>(basePayrollPeriodApi, payload);
    return response.data;
}

export async function updatePayrollPeriod(
    id: string,
    payload: UpdatePayrollPeriodPayload,
): Promise<PayrollPeriod> {
    const response = await api.put<PayrollPeriod>(
        `${basePayrollPeriodApi}/${id}`,
        payload,
    );
    return response.data;
}

export async function openPayrollPeriod(id: string): Promise<PayrollPeriod> {
    const response = await api.patch<PayrollPeriod>(
        `${basePayrollPeriodApi}/${id}/open`,
    );
    return response.data;
}

export async function closePayrollPeriod(id: string): Promise<PayrollPeriod> {
    const response = await api.patch<PayrollPeriod>(
        `${basePayrollPeriodApi}/${id}/close`,
    );
    return response.data;
}

export async function deletePayrollPeriod(id: string): Promise<void> {
    await api.delete(`${basePayrollPeriodApi}/${id}`);
}

export function getPayrollPeriodErrorMessage(error: unknown): string {
    return getApiErrorMessage(
        error,
        'Unable to process the payroll period request. Please try again.',
    );
}
