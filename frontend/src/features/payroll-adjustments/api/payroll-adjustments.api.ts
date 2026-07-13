import { getApiErrorMessage } from '@/lib/api-error';
import { api } from '@/lib/axios';
import { type I18nKey } from '@/i18n';
import {
    type PayrollAdjustment,
    type PayrollAdjustmentListResponse,
    type PayrollAdjustmentPayload,
    type PayrollAdjustmentSortField,
    type RewardPenaltyCategory,
    type SortOrder,
    type UpdatePayrollAdjustmentPayload,
} from '../types';

const basePayrollAdjustmentApi = '/payroll-adjustments';

type ListPayrollAdjustmentsParams = {
    page: number;
    limit: number;
    search?: string;
    payrollPeriodId?: string;
    employeeId?: string;
    branchId?: string;
    category?: RewardPenaltyCategory;
    sortBy: PayrollAdjustmentSortField;
    sortOrder: SortOrder;
};

export async function listPayrollAdjustments(
    params: ListPayrollAdjustmentsParams,
): Promise<PayrollAdjustmentListResponse> {
    const response = await api.get<PayrollAdjustmentListResponse>(
        basePayrollAdjustmentApi,
        { params },
    );
    return response.data;
}

export async function getPayrollAdjustment(
    id: string,
): Promise<PayrollAdjustment> {
    const response = await api.get<PayrollAdjustment>(
        `${basePayrollAdjustmentApi}/${id}`,
    );
    return response.data;
}

export async function createPayrollAdjustment(
    payload: PayrollAdjustmentPayload,
): Promise<PayrollAdjustment> {
    const response = await api.post<PayrollAdjustment>(
        basePayrollAdjustmentApi,
        payload,
    );
    return response.data;
}

export async function updatePayrollAdjustment(
    id: string,
    payload: UpdatePayrollAdjustmentPayload,
): Promise<PayrollAdjustment> {
    const response = await api.put<PayrollAdjustment>(
        `${basePayrollAdjustmentApi}/${id}`,
        payload,
    );
    return response.data;
}

export async function deletePayrollAdjustment(id: string): Promise<void> {
    await api.delete(`${basePayrollAdjustmentApi}/${id}`);
}

export function getPayrollAdjustmentErrorMessage(error: unknown): string {
    return getApiErrorMessage(
        error,
        'Unable to process the payroll adjustment request. Please try again.',
    );
}

export function getPayrollAdjustmentErrorKey(error: unknown): I18nKey {
    const message = getPayrollAdjustmentErrorMessage(error);
    const errorKeys: Record<string, I18nKey> = {
        'At least one field must be provided': 'payrollAdjustments.errors.emptyPayload',
        'Payroll adjustment not found': 'payrollAdjustments.errors.notFound',
        'Payroll period not found': 'payrollAdjustments.errors.periodNotFound',
        'Employee not found': 'payrollAdjustments.errors.employeeNotFound',
        'Branch not found': 'payrollAdjustments.errors.branchNotFound',
        'Reward penalty catalog not found': 'payrollAdjustments.errors.catalogNotFound',
        'Payroll period must be open to change adjustments': 'payrollAdjustments.errors.periodMustBeOpen',
        'Reward penalty catalog must be active': 'payrollAdjustments.errors.catalogMustBeActive',
        'Employee does not belong to the selected branch': 'payrollAdjustments.errors.employeeBranchMismatch',
        'Adjustment date must be within the payroll period': 'payrollAdjustments.errors.dateOutsidePeriod',
        'You can only manage payroll adjustments in your branches': 'payrollAdjustments.errors.branchForbidden',
        'Managed branch scope is required for managers': 'payrollAdjustments.errors.branchScopeRequired',
        'Reason is required': 'payrollAdjustments.errors.reasonRequired',
        'Payroll adjustment already exists': 'payrollAdjustments.errors.exists',
        'Payroll adjustment cannot be deleted because related data exists': 'payrollAdjustments.errors.deleteRelated',
    };

    return errorKeys[message] ?? 'payrollAdjustments.errors.generic';
}
