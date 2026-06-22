import {
    faBriefcase,
    faGraduationCap,
    faIdCard,
    faUser,
    type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { type I18nKey } from '@/i18n';

export type EmployeeTab = 'profile' | 'account' | 'education' | 'work';

export const employeeDetailTabs: Array<{
    id: EmployeeTab;
    labelKey: I18nKey;
    icon: IconDefinition;
}> = [
    { id: 'profile', labelKey: 'employees.profile', icon: faUser },
    { id: 'account', labelKey: 'employees.account', icon: faIdCard },
    { id: 'education', labelKey: 'employees.education', icon: faGraduationCap },
    { id: 'work', labelKey: 'employees.work', icon: faBriefcase },
];
