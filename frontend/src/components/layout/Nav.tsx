import { type MouseEvent, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';
import {
    faBriefcase,
    faCalendarCheck,
    faBuilding,
    faCalendarDays,
    faChartColumn,
    faClock,
    faFileLines,
    faGear,
    faUsers,
    type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { routes } from '@/constants/routes';
import { roles, type Role } from '@/constants/roles';
import { type I18nKey, useI18n } from '@/i18n';

const navigation: Array<{
    labelKey: I18nKey;
    icon: IconDefinition;
    href: string;
    allowedRoles?: readonly Role[];
}> = [
        { labelKey: 'nav.dashboard', icon: faChartColumn, href: routes.dashboard },
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
            allowedRoles: [roles.admin, roles.manager, roles.user],
        },
        { labelKey: 'nav.workShifts', icon: faCalendarDays, href: routes.workShifts, allowedRoles: [roles.admin, roles.manager] },
        { labelKey: 'nav.workSchedules', icon: faCalendarCheck, href: routes.workSchedules, allowedRoles: [roles.admin, roles.manager, roles.user] },
        { labelKey: 'nav.attendance', icon: faClock, href: '#' },
        { labelKey: 'nav.leaveRequests', icon: faFileLines, href: '#' },
        { labelKey: 'nav.settings', icon: faGear, href: routes.settings },
    ];

type NavProps = {
    defaultActiveItem?: I18nKey;
    userRole: Role;
};

export function Nav({
    defaultActiveItem = 'nav.dashboard',
    userRole,
}: NavProps) {
    const { t } = useI18n();
    const [activeItem, setActiveItem] = useState(defaultActiveItem);

    function handleNavigation(
        event: MouseEvent<HTMLAnchorElement>,
        labelKey: I18nKey,
        href: string,
    ) {
        setActiveItem(labelKey);

        if (href === '#') {
            event.preventDefault();
        }
    }

    return (
        <aside className="sticky top-0 flex h-screen flex-col border-r border-[#e8e7ef] bg-white px-4 pt-6 pb-5 max-sm:static max-sm:h-auto max-sm:border-r-0 max-sm:border-b max-sm:py-3">
            <a className="flex items-center gap-2.5 px-2 pb-7 max-sm:pb-3" href="#">
                <span className="relative flex size-[22px] rotate-45 items-center justify-center rounded-[5px] bg-primary-600 after:size-[7px] after:rounded-sm after:bg-white after:content-['']" />
                <strong className="text-xl tracking-[-0.5px] text-slate-950">
                    {t('common.appName')}
                </strong>
            </a>

            <nav
                aria-label={t('nav.mainNavigation')}
                className="grid gap-1.5 max-sm:flex max-sm:overflow-x-auto max-sm:pb-1"
            >
                {navigation
                    .filter(
                        (item) =>
                            !item.allowedRoles ||
                            item.allowedRoles.includes(userRole),
                    )
                    .map((item) => {
                        const label = t(item.labelKey);
                        const isActive = activeItem === item.labelKey;
                        const className = `relative flex min-h-11 items-center gap-3.5 rounded-lg px-3.5 text-sm font-medium whitespace-nowrap transition-colors ${isActive
                            ? "bg-primary-50 text-primary-700 before:absolute before:-left-4 before:h-6 before:w-[3px] before:rounded-r before:bg-primary-600 max-sm:before:inset-x-3 max-sm:before:-bottom-1 max-sm:before:top-auto max-sm:before:h-[3px] max-sm:before:w-auto"
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            } max-sm:flex-none`;
                        const content = (
                            <>
                                <FontAwesomeIcon
                                    className="w-[18px] shrink-0"
                                    icon={item.icon}
                                />
                                <span>{label}</span>
                            </>
                        );

                        if (item.href !== '#') {
                            return (
                                <Link
                                    aria-current={isActive ? 'page' : undefined}
                                    className={className}
                                    key={item.labelKey}
                                    to={item.href}
                                    onClick={() => setActiveItem(item.labelKey)}
                                >
                                    {content}
                                </Link>
                            );
                        }

                        return (
                            <a
                                aria-current={isActive ? 'page' : undefined}
                                className={className}
                                href={item.href}
                                key={item.labelKey}
                                onClick={(event) =>
                                    handleNavigation(
                                        event,
                                        item.labelKey,
                                        item.href,
                                    )
                                }
                            >
                                {content}
                            </a>
                        );
                    })}
            </nav>
        </aside>
    );
}
