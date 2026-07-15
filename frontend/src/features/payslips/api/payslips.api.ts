import { type I18nKey } from '@/i18n';
import { getApiErrorMessage } from '@/lib/api-error';
import { api } from '@/lib/axios';
import {
    type Payslip,
    type PayslipListResponse,
    type PayslipSortField,
    type SortOrder,
} from '../types';

const basePayslipApi = '/payslips';

type ListPayslipsParams = {
    page: number;
    limit: number;
    search?: string;
    payrollPeriodId?: string;
    branchId?: string;
    employeeId?: string;
    sortBy: PayslipSortField;
    sortOrder: SortOrder;
};

export async function listPayslips(
    params: ListPayslipsParams,
): Promise<PayslipListResponse> {
    const response = await api.get<PayslipListResponse>(basePayslipApi, {
        params,
    });
    return response.data;
}

export async function listMyPayslips(
    params: ListPayslipsParams,
): Promise<PayslipListResponse> {
    const response = await api.get<PayslipListResponse>(`${basePayslipApi}/me`, {
        params,
    });
    return response.data;
}

export async function getPayslip(id: string): Promise<Payslip> {
    const response = await api.get<Payslip>(`${basePayslipApi}/${id}`);
    return response.data;
}

export function getPayslipErrorMessage(error: unknown): string {
    return getApiErrorMessage(
        error,
        'Unable to process the payslip request. Please try again.',
    );
}

export function getPayslipErrorKey(error: unknown): I18nKey {
    const message = getPayslipErrorMessage(error);
    const errorKeys: Record<string, I18nKey> = {
        'Payslip not found': 'payslips.errors.notFound',
        'Employee account is not linked': 'payslips.errors.employeeNotLinked',
        'You can only view your own payslips': 'payslips.errors.ownOnly',
        'You do not have permission to view payslips': 'payslips.errors.forbidden',
        'You can only view payslips in your branches': 'payslips.errors.branchForbidden',
    };

    return errorKeys[message] ?? 'payslips.errors.generic';
}
