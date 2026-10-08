import { type I18nKey } from '@/i18n';
import { getApiErrorKey, getApiErrorMessage } from '@/lib/api-error';
import { api } from '@/lib/axios';
import {
    type DashboardMine,
    type DashboardRangeDays,
    type DashboardSummary,
} from '../types';

const baseDashboardApi = '/dashboard';

type DashboardSummaryParams = {
    branchId?: string;
    days: DashboardRangeDays;
};

export async function getDashboardSummary(
    params: DashboardSummaryParams,
): Promise<DashboardSummary> {
    const response = await api.get<DashboardSummary>(
        `${baseDashboardApi}/summary`,
        { params },
    );
    return response.data;
}

export async function getMyDashboard(): Promise<DashboardMine> {
    const response = await api.get<DashboardMine>(`${baseDashboardApi}/me`);
    return response.data;
}

export function getDashboardErrorKey(error: unknown): I18nKey {
    const message = getApiErrorMessage(error, '');
    const errorKeys: Record<string, I18nKey> = {
        'You can only view dashboard data in your branches':
            'dashboard.errors.branchForbidden',
        'Employee account is not linked': 'dashboard.errors.employeeNotLinked',
    };

    return errorKeys[message] ?? getApiErrorKey(error, 'dashboard.errors.generic');
}
