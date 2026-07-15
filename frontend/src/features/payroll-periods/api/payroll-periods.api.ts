import { getApiErrorMessage } from '@/lib/api-error';
import { api } from '@/lib/axios';
import { type I18nKey } from '@/i18n';
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

export function getPayrollPeriodErrorKey(error: unknown): I18nKey {
    const message = getPayrollPeriodErrorMessage(error);
    const errorKeys: Record<string, I18nKey> = {
        'At least one field must be provided': 'payrollPeriods.errors.emptyPayload',
        'Only draft payroll periods can be opened': 'payrollPeriods.errors.onlyDraftCanOpen',
        'Only open payroll periods can be closed': 'payrollPeriods.errors.onlyOpenCanClose',
        'Payroll period not found': 'payrollPeriods.errors.notFound',
        'Only draft payroll periods can be changed': 'payrollPeriods.errors.onlyDraftCanChange',
        'Start date must be before end date': 'payrollPeriods.errors.invalidDateRange',
        'Payroll period already exists for this month': 'payrollPeriods.errors.monthExists',
        'Payroll period date range overlaps another period': 'payrollPeriods.errors.dateRangeOverlap',
        'Payroll period already exists': 'payrollPeriods.errors.exists',
        'Payroll period cannot be deleted because related data exists': 'payrollPeriods.errors.deleteRelated',
        'Payroll processing must be closed before closing payroll period': 'payrollPeriods.errors.processingMustBeClosed',
    };

    return errorKeys[message] ?? 'payrollPeriods.errors.generic';
}
