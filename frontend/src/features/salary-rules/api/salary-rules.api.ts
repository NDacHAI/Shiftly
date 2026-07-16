import { type I18nKey } from '@/i18n';
import { getApiErrorKey, getApiErrorMessage } from '@/lib/api-error';
import { api } from '@/lib/axios';
import {
    type SalaryRule,
    type SalaryRuleListResponse,
    type SalaryRulePayload,
    type SalaryRuleSortField,
    type SalaryRuleStatus,
    type SortOrder,
    type UpdateSalaryRulePayload,
} from '../types';

const baseSalaryRuleApi = '/salary-rules';

type ListSalaryRulesParams = {
    page: number;
    limit: number;
    search?: string;
    status?: SalaryRuleStatus;
    sortBy: SalaryRuleSortField;
    sortOrder: SortOrder;
};

export async function listSalaryRules(
    params: ListSalaryRulesParams,
): Promise<SalaryRuleListResponse> {
    const response = await api.get<SalaryRuleListResponse>(
        baseSalaryRuleApi,
        { params },
    );
    return response.data;
}

export async function getSalaryRule(id: string): Promise<SalaryRule> {
    const response = await api.get<SalaryRule>(`${baseSalaryRuleApi}/${id}`);
    return response.data;
}

export async function createSalaryRule(
    payload: SalaryRulePayload,
): Promise<SalaryRule> {
    const response = await api.post<SalaryRule>(baseSalaryRuleApi, payload);
    return response.data;
}

export async function updateSalaryRule(
    id: string,
    payload: UpdateSalaryRulePayload,
): Promise<SalaryRule> {
    const response = await api.put<SalaryRule>(
        `${baseSalaryRuleApi}/${id}`,
        payload,
    );
    return response.data;
}

export async function deleteSalaryRule(id: string): Promise<void> {
    await api.delete(`${baseSalaryRuleApi}/${id}`);
}

export function getSalaryRuleErrorMessage(error: unknown): string {
    return getApiErrorMessage(
        error,
        'Unable to process the salary rule request. Please try again.',
    );
}

export function getSalaryRuleErrorKey(error: unknown): I18nKey {
    return getApiErrorKey(error);
}
