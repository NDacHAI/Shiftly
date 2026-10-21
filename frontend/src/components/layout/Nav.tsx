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
    faChevronDown,
    faChevronLeft,
} from '@fortawesome/free-solid-svg-icons';
import { routes } from '@/constants/routes';
import { type Role } from '@/constants/roles';
import { type I18nKey, useI18n } from '@/i18n';
import { navigationGroups, type NavigationItem } from './navigation';

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
            className={`sticky top-0 flex h-screen flex-col border-r border-line bg-white transition-[padding] duration-200 max-sm:static max-sm:h-auto max-sm:border-r-0 max-sm:border-b ${
                collapsed ? 'px-2.5' : 'px-3'
            }`}
        >
            <div
                className={`flex h-16 shrink-0 items-center max-sm:h-14 max-sm:justify-start ${
                    collapsed ? 'justify-center' : 'justify-between gap-2 pl-2'
                }`}
            >
                <a
                    className="flex min-w-0 items-center gap-2.5"
                    href="#"
                    title={t('common.appName')}
                >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-600 shadow-sm">
                        <span className="relative flex size-3.5 rotate-45 items-center justify-center rounded-[3px] bg-white after:size-1.5 after:rounded-[1px] after:bg-primary-600 after:content-['']" />
                    </span>
                    <strong
                        className={`truncate text-[17px] font-bold tracking-tight text-slate-900 ${
                            collapsed ? 'sr-only max-sm:not-sr-only' : ''
                        }`}
                    >
                        {t('common.appName')}
                    </strong>
                </a>
                {!collapsed && (
                    <button
                        aria-label={toggleLabel}
                        className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-sm text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 max-sm:hidden"
                        title={toggleLabel}
                        type="button"
                        onClick={onToggleCollapsed}
                    >
                        <FontAwesomeIcon icon={faChevronLeft} />
                    </button>
                )}
            </div>

            {collapsed && (
                <button
                    aria-label={toggleLabel}
                    className="mx-auto mb-2 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 max-sm:hidden"
                    title={toggleLabel}
                    type="button"
                    onClick={onToggleCollapsed}
                >
                    <FontAwesomeIcon icon={faBars} />
                </button>
            )}

            <nav
                aria-label={t('nav.mainNavigation')}
                className="grid content-start gap-4 overflow-x-hidden overflow-y-auto pt-2 pb-6 [overflow-anchor:none] [scrollbar-width:thin] max-sm:flex max-sm:gap-1 max-sm:overflow-x-auto max-sm:pt-0 max-sm:pb-2"
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
                    const groupExpanded = collapsed || expandedGroups[group.labelKey];
                    const groupActive = activeGroupKey === group.labelKey;

                    return (
                        <section
                            className="grid gap-1 max-sm:flex max-sm:flex-none max-sm:items-center"
                            key={group.labelKey}
                        >
                            {collapsed ? (
                                <span
                                    aria-hidden="true"
                                    className="mx-auto mb-1 h-px w-6 bg-slate-200 max-sm:hidden"
                                />
                            ) : (
                                <button
                                    aria-expanded={groupExpanded}
                                    className={`group/heading flex cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-1 text-left text-[11px] font-semibold tracking-[0.06em] uppercase transition-colors max-sm:sr-only ${
                                        groupActive
                                            ? 'text-slate-600'
                                            : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                    type="button"
                                    onClick={() => toggleGroup(group.labelKey)}
                                >
                                    <span>{t(group.labelKey)}</span>
                                    <FontAwesomeIcon
                                        className={`size-2.5 transition duration-200 group-hover/heading:opacity-100 ${
                                            groupExpanded ? 'opacity-0' : '-rotate-90 opacity-100'
                                        }`}
                                        icon={faChevronDown}
                                    />
                                </button>
                            )}

                            <div
                                className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-out max-sm:flex max-sm:max-h-none max-sm:flex-none max-sm:items-center max-sm:opacity-100 ${
                                    groupExpanded
                                        ? 'max-h-[520px] opacity-100'
                                        : 'max-h-0 opacity-0'
                                }`}
                            >
                                <div className="grid gap-0.5 max-sm:flex max-sm:flex-none max-sm:items-center">
                                {visibleItems.map((item) => {
                                const label = t(item.labelKey);
                                const isActive = routeActiveItem === item.labelKey;
                                const className = `group/item relative flex h-9 items-center rounded-lg text-[13.5px] whitespace-nowrap transition-colors ${
                                    collapsed
                                        ? 'justify-center px-0 max-sm:gap-3 max-sm:px-3'
                                        : 'gap-3 px-3'
                                } ${
                                    isActive
                                        ? 'bg-primary-50 font-semibold text-primary-700'
                                        : 'font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                } max-sm:flex-none`;
                                const content = (
                                    <>
                                        <FontAwesomeIcon
                                            className={`w-4 shrink-0 text-[15px] ${
                                                isActive
                                                    ? 'text-primary-600'
                                                    : 'text-slate-400 group-hover/item:text-slate-600'
                                            }`}
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
