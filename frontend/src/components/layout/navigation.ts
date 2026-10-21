import {
    faBriefcase,
    faCalendarDay,
    faCalendarCheck,
    faBuilding,
    faCalendarDays,
    faChartColumn,
    faClock,
    faCoins,
    faCalculator,
    faFileInvoiceDollar,
    faFileLines,
    faGear,
    faPenToSquare,
    faReceipt,
    faUsers,
    type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { routes } from '@/constants/routes';
import { roles, type Role } from '@/constants/roles';
import { type I18nKey } from '@/i18n';

export type NavigationItem = {
    labelKey: I18nKey;
    icon: IconDefinition;
    href: string;
    allowedRoles?: readonly Role[];
};

export const navigationGroups: Array<{
    labelKey: I18nKey;
    items: NavigationItem[];
}> = [
    {
        labelKey: 'nav.groups.overview',
        items: [{ labelKey: 'nav.dashboard', icon: faChartColumn, href: routes.dashboard }],
    },
    {
        labelKey: 'nav.groups.organization',
        items: [
            {
                labelKey: 'nav.branches',
                icon: faBuilding,
                href: routes.branches,
                allowedRoles: [roles.admin, roles.manager],
            },
            {
                labelKey: 'nav.positions',
                icon: faBriefcase,
                href: routes.positions,
                allowedRoles: [roles.admin, roles.manager],
            },
            {
                labelKey: 'nav.employees',
                icon: faUsers,
                href: routes.employees,
                allowedRoles: [roles.admin, roles.manager],
            },
        ],
    },
    {
        labelKey: 'nav.groups.scheduling',
        items: [
            {
                labelKey: 'nav.workShifts',
                icon: faCalendarDays,
                href: routes.workShifts,
                allowedRoles: [roles.admin, roles.manager],
            },
            {
                labelKey: 'nav.workSchedules',
                icon: faCalendarCheck,
                href: routes.workSchedules,
                allowedRoles: [roles.admin, roles.manager, roles.user],
            },
            {
                labelKey: 'nav.shiftRequests',
                icon: faFileLines,
                href: routes.shiftRequests,
                allowedRoles: [roles.admin, roles.manager, roles.user],
            },
            {
                labelKey: 'nav.leaveRequests',
                icon: faFileLines,
                href: routes.leaveRequests,
                allowedRoles: [roles.admin, roles.manager, roles.user],
            },
            {
                labelKey: 'nav.holidays',
                icon: faCalendarDay,
                href: routes.holidays,
                allowedRoles: [roles.admin, roles.manager, roles.user],
            },
            {
                labelKey: 'nav.attendance',
                icon: faClock,
                href: routes.attendance,
                allowedRoles: [roles.admin, roles.manager, roles.user],
            },
        ],
    },
    {
        labelKey: 'nav.groups.payroll',
        items: [
            {
                labelKey: 'nav.payrollPeriods',
                icon: faCalendarDays,
                href: routes.payrollPeriods,
                allowedRoles: [roles.admin, roles.manager],
            },
            {
                labelKey: 'nav.payrollAdjustments',
                icon: faPenToSquare,
                href: routes.payrollAdjustments,
                allowedRoles: [roles.admin, roles.manager],
            },
            {
                labelKey: 'nav.payrollProcessings',
                icon: faFileInvoiceDollar,
                href: routes.payrollProcessings,
                allowedRoles: [roles.admin, roles.manager],
            },
            {
                labelKey: 'nav.payslips',
                icon: faReceipt,
                href: routes.payslips,
                allowedRoles: [roles.admin, roles.manager, roles.user],
            },
            {
                labelKey: 'nav.salaryRules',
                icon: faCalculator,
                href: routes.salaryRules,
                allowedRoles: [roles.admin, roles.manager],
            },
            {
                labelKey: 'nav.rewardPenaltyCatalogs',
                icon: faCoins,
                href: routes.rewardPenaltyCatalogs,
                allowedRoles: [roles.admin, roles.manager],
            },
        ],
    },
    {
        labelKey: 'nav.groups.system',
        items: [{ labelKey: 'nav.settings', icon: faGear, href: routes.settings }],
    },
];

export function findNavGroupLabelKey(labelKey: I18nKey) {
    return navigationGroups.find((group) =>
        group.items.some((item) => item.labelKey === labelKey),
    )?.labelKey;
}
