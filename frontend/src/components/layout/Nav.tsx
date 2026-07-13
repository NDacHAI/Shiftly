import {
    type MouseEvent,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link, useLocation } from 'react-router-dom';
import {
    faBars,
    faBriefcase,
    faCalendarDay,
    faCalendarCheck,
    faBuilding,
    faCalendarDays,
    faChartColumn,
    faChevronDown,
    faChevronLeft,
    faClock,
    faCoins,
    faFileLines,
    faGear,
    faUsers,
    type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { routes } from '@/constants/routes';
import { roles, type Role } from '@/constants/roles';
import { type I18nKey, useI18n } from '@/i18n';

type NavigationItem = {
    labelKey: I18nKey;
    icon: IconDefinition;
    href: string;
    allowedRoles?: readonly Role[];
};

const navigationGroups: Array<{
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
                labelKey: 'nav.salaryRules',
                icon: faCoins,
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

const navigation = navigationGroups.flatMap((group) => group.items);
const defaultExpandedGroups = navigationGroups.reduce<Record<string, boolean>>(
    (groups, group) => ({
        ...groups,
        [group.labelKey]: true,
    }),
    {},
);
let persistedExpandedGroups = defaultExpandedGroups;
let persistedNavScrollTop = 0;

function canAccess(item: NavigationItem, userRole: Role) {
    return !item.allowedRoles || item.allowedRoles.includes(userRole);
}

function isCurrentRoute(pathname: string, href: string) {
    if (href === routes.dashboard) {
        return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
}

type NavProps = {
    collapsed: boolean;
    defaultActiveItem?: I18nKey;
    onToggleCollapsed: () => void;
    userRole: Role;
};

export function Nav({
    collapsed,
    defaultActiveItem = 'nav.dashboard',
    onToggleCollapsed,
    userRole,
}: NavProps) {
    const { t } = useI18n();
    const { pathname } = useLocation();
    const navRef = useRef<HTMLElement | null>(null);
    const [activeItem, setActiveItem] = useState(defaultActiveItem);
    const [expandedGroups, setExpandedGroups] = useState(
        () => persistedExpandedGroups,
    );
    const routeActiveItem =
        navigation.find((item) => isCurrentRoute(pathname, item.href))?.labelKey ??
        activeItem;
    const activeGroupKey = navigationGroups.find((group) =>
        group.items.some((item) => item.labelKey === routeActiveItem),
    )?.labelKey;
    const toggleLabel = collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar');

    useLayoutEffect(() => {
        const nav = navRef.current;

        if (!nav) {
            return;
        }

        nav.scrollTop = persistedNavScrollTop;
        requestAnimationFrame(() => {
            nav.scrollTop = persistedNavScrollTop;
        });
    }, []);

    useEffect(() => {
        if (!activeGroupKey) {
            return;
        }

        setExpandedGroups((current) => {
            if (current[activeGroupKey]) {
                return current;
            }

            const next = {
                ...current,
                [activeGroupKey]: true,
            };

            persistedExpandedGroups = next;

            return next;
        });
    }, [activeGroupKey]);

    function toggleGroup(labelKey: I18nKey) {
        setExpandedGroups((current) => {
            const next = {
                ...current,
                [labelKey]: !current[labelKey],
            };

            persistedExpandedGroups = next;

            return next;
        });
    }

    function rememberNavScroll() {
        persistedNavScrollTop = navRef.current?.scrollTop ?? persistedNavScrollTop;
    }

    function handleNavScroll() {
        rememberNavScroll();
    }

    function handleNavigation(
        event: MouseEvent<HTMLAnchorElement>,
        labelKey: I18nKey,
        href: string,
    ) {
        rememberNavScroll();
        setActiveItem(labelKey);

        if (href === '#') {
            event.preventDefault();
        }
    }

    return (
        <aside
            className={`sticky top-0 flex h-screen flex-col border-r border-[#e8e7ef] bg-white pt-6 pb-5 transition-[padding] duration-200 max-sm:static max-sm:h-auto max-sm:border-r-0 max-sm:border-b max-sm:px-4 max-sm:py-3 ${
                collapsed ? 'px-3' : 'px-4'
            }`}
        >
            <div
                className={`flex items-center pb-7 max-sm:justify-start max-sm:pb-3 ${
                    collapsed ? 'justify-center' : 'justify-between gap-2'
                }`}
            >
                <a
                    className={`flex min-w-0 items-center gap-2.5 ${
                        collapsed ? 'justify-center px-0 max-sm:px-2' : 'px-2'
                    }`}
                    href="#"
                    title={t('common.appName')}
                >
                    <span className="relative flex size-[22px] shrink-0 rotate-45 items-center justify-center rounded-[5px] bg-primary-600 after:size-[7px] after:rounded-sm after:bg-white after:content-['']" />
                    <strong
                        className={`truncate text-xl tracking-[-0.5px] text-slate-950 ${
                            collapsed ? 'sr-only max-sm:not-sr-only' : ''
                        }`}
                    >
                        {t('common.appName')}
                    </strong>
                </a>
                <button
                    aria-label={toggleLabel}
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 max-sm:hidden"
                    title={toggleLabel}
                    type="button"
                    onClick={onToggleCollapsed}
                >
                    <FontAwesomeIcon icon={collapsed ? faBars : faChevronLeft} />
                </button>
            </div>

            <nav
                aria-label={t('nav.mainNavigation')}
                className={`grid overflow-y-auto overflow-x-hidden [overflow-anchor:none] max-sm:flex max-sm:gap-3 max-sm:overflow-x-auto max-sm:pb-1 ${
                    collapsed ? 'gap-1.5 pr-0' : 'gap-1.5 pr-1'
                }`}
                ref={navRef}
                onScroll={handleNavScroll}
            >
                {navigationGroups.map((group) => {
                    const visibleItems = group.items.filter((item) =>
                        canAccess(item, userRole),
                    );

                    if (visibleItems.length === 0) {
                        return null;
                    }
                    const groupExpanded = expandedGroups[group.labelKey];
                    const groupActive = activeGroupKey === group.labelKey;

                    return (
                        <section
                            className="grid gap-0.5 max-sm:flex max-sm:flex-none max-sm:items-center"
                            key={group.labelKey}
                        >
                            <button
                                aria-expanded={groupExpanded}
                                className={`flex cursor-pointer items-center rounded-md border-l-2 py-2 text-left text-base font-medium tracking-normal transition-colors max-sm:sr-only ${
                                    groupActive
                                        ? 'border-primary-600 text-primary-700'
                                        : groupExpanded
                                          ? 'border-slate-300 text-slate-700'
                                          : 'border-slate-200 text-slate-600'
                                } ${
                                    collapsed
                                        ? 'justify-center px-0'
                                        : 'justify-between gap-2 px-3.5'
                                } ${
                                    groupExpanded
                                        ? 'bg-primary-50 hover:bg-primary-100 hover:text-primary-800'
                                        : 'bg-slate-50 hover:border-slate-400 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                                title={collapsed ? t(group.labelKey) : undefined}
                                type="button"
                                onClick={() => toggleGroup(group.labelKey)}
                            >
                                <span className={collapsed ? 'sr-only' : ''}>
                                    {t(group.labelKey)}
                                </span>
                                <FontAwesomeIcon
                                    className={`text-sm transition-transform duration-300 ${
                                        groupActive ? 'text-primary-600' : 'text-slate-500'
                                    } ${
                                        groupExpanded
                                            ? 'rotate-0'
                                            : '-rotate-90'
                                    }`}
                                    icon={faChevronDown}
                                />
                            </button>

                            <div
                                className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-out max-sm:flex max-sm:max-h-none max-sm:flex-none max-sm:items-center max-sm:opacity-100 ${
                                    groupExpanded
                                        ? 'max-h-[520px] opacity-100'
                                        : 'max-h-0 opacity-0'
                                }`}
                            >
                                <div
                                    className={`grid gap-1 pt-0.5 max-sm:flex max-sm:flex-none max-sm:items-center ${
                                        collapsed ? '' : 'pl-4'
                                    }`}
                                >
                                {visibleItems.map((item) => {
                                const label = t(item.labelKey);
                                const isActive = routeActiveItem === item.labelKey;
                                const className = `relative flex min-h-10 items-center rounded-md text-sm whitespace-nowrap transition-colors ${
                                    collapsed
                                        ? 'justify-center px-0 max-sm:gap-3.5 max-sm:px-3.5'
                                        : 'gap-3.5 px-3.5'
                                } ${
                                    isActive
                                        ? "bg-primary-100 font-semibold text-primary-800 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.12)] before:absolute before:left-0 before:h-5 before:w-[3px] before:rounded-r before:bg-primary-600 max-sm:before:inset-x-3 max-sm:before:-bottom-1 max-sm:before:top-auto max-sm:before:h-[3px] max-sm:before:w-auto"
                                        : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                } max-sm:flex-none`;
                                const content = (
                                    <>
                                        <FontAwesomeIcon
                                            className="w-[18px] shrink-0"
                                            icon={item.icon}
                                        />
                                        <span
                                            className={
                                                collapsed ? 'sr-only max-sm:not-sr-only' : ''
                                            }
                                        >
                                            {label}
                                        </span>
                                    </>
                                );

                                if (item.href !== '#') {
                                    return (
                                        <Link
                                            aria-current={isActive ? 'page' : undefined}
                                            className={className}
                                            key={item.labelKey}
                                            title={collapsed ? label : undefined}
                                            to={item.href}
                                            onClick={() => {
                                                rememberNavScroll();
                                                setActiveItem(item.labelKey);
                                            }}
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
                                        title={collapsed ? label : undefined}
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
                                </div>
                            </div>
                        </section>
                    );
                })}
            </nav>
        </aside>
    );
}
