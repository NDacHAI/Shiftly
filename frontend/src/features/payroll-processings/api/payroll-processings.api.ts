import { type I18nKey } from '@/i18n';
import { getApiErrorMessage } from '@/lib/api-error';
import { api } from '@/lib/axios';
import {
    type EmployeePayroll,
    type EmployeePayrollListResponse,
    type EmployeePayrollSortField,
    type EmployeePayrollStatus,
    type PayrollProcessing,
    type PayrollProcessingListResponse,
    type PayrollProcessingSortField,
    type PayrollProcessingStatus,
    type SortOrder,
} from '../types';

const basePayrollProcessingApi = '/payroll-processings';

type ListPayrollProcessingsParams = {
    page: number;
    limit: number;
    search?: string;
    status?: PayrollProcessingStatus;
    payrollPeriodId?: string;
    sortBy: PayrollProcessingSortField;
    sortOrder: SortOrder;
};

type ListEmployeePayrollsParams = {
    page: number;
    limit: number;
    search?: string;
    status?: EmployeePayrollStatus;
    branchId?: string;
    sortBy: EmployeePayrollSortField;
    sortOrder: SortOrder;
};

export async function listPayrollProcessings(
    params: ListPayrollProcessingsParams,
): Promise<PayrollProcessingListResponse> {
    const response = await api.get<PayrollProcessingListResponse>(
        basePayrollProcessingApi,
        { params },
    );
    return response.data;
}

export async function getPayrollProcessing(
    id: string,
): Promise<PayrollProcessing> {
    const response = await api.get<PayrollProcessing>(
        `${basePayrollProcessingApi}/${id}`,
    );
    return response.data;
}

export async function generatePayrollProcessing(
    payrollPeriodId: string,
): Promise<PayrollProcessing> {
    const response = await api.post<PayrollProcessing>(
        `${basePayrollProcessingApi}/periods/${payrollPeriodId}/generate`,
    );
    return response.data;
}

export async function recalculatePayrollProcessing(
    id: string,
): Promise<PayrollProcessing> {
    const response = await api.patch<PayrollProcessing>(
        `${basePayrollProcessingApi}/${id}/recalculate`,
    );
    return response.data;
}

export async function closePayrollProcessing(
    id: string,
): Promise<PayrollProcessing> {
    const response = await api.patch<PayrollProcessing>(
        `${basePayrollProcessingApi}/${id}/close`,
    );
    return response.data;
}

export async function listEmployeePayrolls(
    processingId: string,
    params: ListEmployeePayrollsParams,
): Promise<EmployeePayrollListResponse> {
    const response = await api.get<EmployeePayrollListResponse>(
        `${basePayrollProcessingApi}/${processingId}/employee-payrolls`,
        { params },
    );
    return response.data;
}

export async function retryEmployeePayroll(
    employeePayrollId: string,
): Promise<EmployeePayroll> {
    const response = await api.patch<EmployeePayroll>(
        `${basePayrollProcessingApi}/employee-payrolls/${employeePayrollId}/retry`,
    );
    return response.data;
}

export function getPayrollProcessingErrorMessage(error: unknown): string {
    return getApiErrorMessage(
        error,
        'Unable to process the payroll processing request. Please try again.',
    );
}

export function getPayrollProcessingErrorKey(error: unknown): I18nKey {
    const message = getPayrollProcessingErrorMessage(error);
    const errorKeys: Record<string, I18nKey> = {
        'Payroll Period is not active': 'payrollProcessings.errors.periodNotActive',
        'Payroll period not found': 'payrollProcessings.errors.periodNotFound',
        'Payroll Processing not found': 'payrollProcessings.errors.processingNotFound',
        'Employee Payroll not found': 'payrollProcessings.errors.employeePayrollNotFound',
        'Payroll Processing already exists for this payroll period': 'payrollProcessings.errors.exists',
        'Payroll Rule is required before generating payroll': 'payrollProcessings.errors.ruleRequired',
        'No employees found for this payroll period': 'payrollProcessings.errors.noEmployees',
        'No attendance found for this employee in the payroll period': 'payrollProcessings.errors.noEmployeeAttendance',
        'Payroll has been closed': 'payrollProcessings.errors.closed',
        'Only completed payroll processing can be closed': 'payrollProcessings.errors.onlyCompletedCanClose',
        'Only failed employee payroll can be retried': 'payrollProcessings.errors.onlyFailedCanRetry',
        'Failed employee payrolls must be resolved before closing': 'payrollProcessings.errors.failedMustResolve',
        'You can only access payroll processing in your branches': 'payrollProcessings.errors.branchForbidden',
        'Managed branch scope is required for managers': 'payrollProcessings.errors.branchScopeRequired',
    };

    return errorKeys[message] ?? 'payrollProcessings.errors.generic';
}
