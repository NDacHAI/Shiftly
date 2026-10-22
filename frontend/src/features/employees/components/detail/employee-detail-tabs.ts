import { type I18nKey } from '@/i18n';
import { type EmployeeStatus } from '../../types';

export type EmployeeTab = 'info' | 'account' | 'education' | 'work';

export const employeeDetailTabs: Array<{
    id: EmployeeTab;
    labelKey: I18nKey;
}> = [
    { id: 'info', labelKey: 'employees.info' },
    { id: 'account', labelKey: 'employees.account' },
    { id: 'education', labelKey: 'employees.education' },
    { id: 'work', labelKey: 'employees.work' },
];

// One form backs the Info and Work tabs so a single save bar covers both.
export type EmployeeDetailFormValues = {
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth: string;
    status: EmployeeStatus;
    email: string;
    phoneNumber: string;
    address: string;
    branchIds: string[];
    positionId: string;
    hireDate: string;
};
