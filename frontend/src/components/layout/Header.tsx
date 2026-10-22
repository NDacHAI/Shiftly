import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faRightFromBracket,
    faUser,
} from '@fortawesome/free-solid-svg-icons';
import { routes } from '@/constants/routes';
import { type Role } from '@/constants/roles';
import { type AuthUser } from '@/features/auth/types';
import { type I18nKey, useI18n } from '@/i18n';
import { navigationGroups, type NavigationItem } from './navigation';
import { useSlidingIndicator } from './useSlidingIndicator';

const indicatorMotion =
    'pointer-events-none absolute left-0 transition-[transform,width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none';

const roleLabelKeys: Record<Role, I18nKey> = {
    admin: 'header.roles.admin',
    manager: 'header.roles.manager',
    user: 'header.roles.user',
};

function canAccess(item: NavigationItem, userRole: Role) {
    return !item.allowedRoles || item.allowedRoles.includes(userRole);
}

function isCurrentRoute(pathname: string, href: string) {
    if (href === routes.dashboard) {
        return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
}

type HeaderProps = {
    activeNavKey: I18nKey;
    user: AuthUser;
    onLogout: () => void;
};

// Two-row top navigation: module groups on the dark bar, the active group's pages below.
export function Header({ activeNavKey, user, onLogout }: HeaderProps) {
    const { language, t } = useI18n();
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const displayName = user.email.split('@')[0];

    const groups = navigationGroups
        .map((group) => ({
            ...group,
            items: group.items.filter((item) => canAccess(item, user.role)),
        }))
        .filter((group) => group.items.length > 0);
    const allItems = groups.flatMap((group) => group.items);
    const activeItemKey =
        allItems.find((item) => isCurrentRoute(pathname, item.href))?.labelKey ??
        activeNavKey;
    const activeGroup =
        groups.find((group) =>
            group.items.some((item) => item.labelKey === activeItemKey),
        ) ?? groups[0];
    const { containerRef: groupNavRef, indicatorRef: groupPillRef } =
        useSlidingIndicator('nav-group', `${activeGroup?.labelKey}|${language}`);
    const { containerRef: tabNavRef, indicatorRef: tabUnderlineRef } =
        useSlidingIndicator('nav-tab', `${activeItemKey}|${language}`);

    useEffect(() => {
        function closeProfile(event: MouseEvent) {
            if (
                profileRef.current &&
                !profileRef.current.contains(event.target as Node)
            ) {
                setProfileOpen(false);
            }
        }

        function closeOnEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setProfileOpen(false);
            }
        }

        document.addEventListener('mousedown', closeProfile);
        document.addEventListener('keydown', closeOnEscape);

        return () => {
            document.removeEventListener('mousedown', closeProfile);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, []);

    return (
        <header className="sticky top-0 z-30 bg-ink text-sand">
            <div className="flex h-[60px] items-center gap-5 px-8 max-sm:gap-3 max-sm:px-4">
                <Link
                    className="flex flex-none items-center gap-2.5 text-sand no-underline hover:text-sand"
                    to={routes.dashboard}
                >
                    <span className="grid size-[26px] place-items-center rounded-[7px] bg-ember">
                        <span className="size-2.5 rotate-45 bg-ink" />
                    </span>
                    <span className="text-[17px] font-bold tracking-[-0.02em] max-sm:sr-only">
                        {t('common.appName')}
                    </span>
                </Link>

                <nav
                    aria-label={t('nav.mainNavigation')}
                    className="relative flex min-w-0 flex-auto gap-1 overflow-x-auto overflow-y-hidden [scrollbar-width:none]"
                    ref={groupNavRef}
                >
                    {/* Shared pill that slides between groups; rendered first so labels paint above it. */}
                    <span
                        aria-hidden="true"
                        className={`${indicatorMotion} inset-y-0 rounded-lg bg-ink-soft opacity-0`}
                        ref={groupPillRef}
                    />
                    {groups.map((group) => {
                        const isActive = group.labelKey === activeGroup?.labelKey;

                        return (
                            <button
                                aria-current={isActive ? 'true' : undefined}
                                className={`relative min-h-0 cursor-pointer rounded-lg border-0 bg-transparent px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-200 hover:text-white ${
                                    isActive ? 'text-white' : 'text-fog'
                                }`}
                                data-active={isActive}
                                key={group.labelKey}
                                type="button"
                                onClick={() => {
                                    if (!isActive) navigate(group.items[0].href);
                                }}
                            >
                                {t(group.labelKey)}
                            </button>
                        );
                    })}
                </nav>

                <button
                    aria-label={t('header.search')}
                    className="grid size-9 min-h-0 flex-none cursor-pointer place-items-center rounded-lg border-0 bg-[#26251d] p-0 hover:bg-ink-soft max-sm:hidden"
                    title={t('header.search')}
                    type="button"
                >
                    <span className="size-[11px] rounded-full border-[1.5px] border-sand" />
                </button>

                <button
                    aria-label={t('header.notifications')}
                    className="relative grid size-9 min-h-0 flex-none cursor-pointer place-items-center rounded-lg border-0 bg-[#26251d] p-0 hover:bg-ink-soft"
                    title={t('header.notifications')}
                    type="button"
                >
                    <span className="size-3 rounded-[6px_6px_2px_2px] border-[1.5px] border-sand" />
                    <span className="absolute top-[7px] right-[7px] size-[7px] rounded-full border-2 border-[#26251d] bg-ember" />
                </button>

                <div className="relative flex-none" ref={profileRef}>
                    <button
                        aria-expanded={profileOpen}
                        aria-haspopup="menu"
                        className="flex min-h-0 cursor-pointer items-center gap-2.5 rounded-lg border-0 bg-transparent p-1 text-left text-sand hover:bg-[#26251d]"
                        type="button"
                        onClick={() => setProfileOpen((open) => !open)}
                    >
                        <span className="grid size-8 place-items-center rounded-full bg-sand text-[13px] font-semibold text-ink">
                            {displayName.charAt(0).toUpperCase()}
                        </span>
                        <span className="flex flex-col pr-1 leading-[1.2] max-md:hidden">
                            <span className="max-w-32 truncate text-[13px] font-semibold">
                                {displayName}
                            </span>
                            <span className="text-[11px] whitespace-nowrap text-fog">
                                {t(roleLabelKeys[user.role])}
                            </span>
                        </span>
                    </button>

                    {profileOpen && (
                        <div
                            className="absolute top-[calc(100%+8px)] right-0 z-20 w-56 overflow-hidden rounded-[10px] border border-rule-strong bg-paper p-1 text-ink shadow-[0_12px_32px_rgba(23,22,15,0.12)]"
                            role="menu"
                        >
                            <div className="border-b border-rule-soft px-3 pt-2 pb-2.5">
                                <p className="truncate text-sm font-semibold">{displayName}</p>
                                <p className="truncate text-xs text-muted">{user.email}</p>
                            </div>
                            <a
                                className="mt-1 flex items-center rounded-md px-3 py-2 text-sm font-medium text-ink no-underline hover:bg-stone-soft hover:text-ink"
                                href="#"
                                role="menuitem"
                                onClick={(event) => {
                                    event.preventDefault();
                                    setProfileOpen(false);
                                }}
                            >
                                <FontAwesomeIcon className="mr-2.5 w-4 text-muted" icon={faUser} />
                                {t('header.profile')}
                            </a>
                            <button
                                className="flex min-h-0 w-full cursor-pointer items-center rounded-md border-0 bg-transparent px-3 py-2 text-left text-sm font-medium text-ember-strong hover:bg-ember-tint"
                                role="menuitem"
                                type="button"
                                onClick={onLogout}
                            >
                                <FontAwesomeIcon className="mr-2.5 w-4" icon={faRightFromBracket} />
                                {t('header.logout')}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {activeGroup && (
                <nav
                    aria-label={t(activeGroup.labelKey)}
                    className="relative flex gap-0.5 overflow-x-auto overflow-y-hidden border-t border-[#2b2a21] px-8 [scrollbar-width:none] max-sm:px-4"
                    ref={tabNavRef}
                >
                    {activeGroup.items.map((item) => {
                        const isActive = item.labelKey === activeItemKey;

                        return (
                            <Link
                                aria-current={isActive ? 'page' : undefined}
                                className={`px-3 py-[11px] text-[13px] whitespace-nowrap no-underline transition-colors duration-200 hover:text-white ${
                                    isActive ? 'text-white' : 'text-fog'
                                }`}
                                data-active={isActive}
                                key={item.labelKey}
                                to={item.href}
                                onClick={(event) => {
                                    if (isActive) event.preventDefault();
                                }}
                            >
                                {t(item.labelKey)}
                            </Link>
                        );
                    })}
                    <span
                        aria-hidden="true"
                        className={`${indicatorMotion} bottom-0 h-0.5 bg-ember opacity-0`}
                        ref={tabUnderlineRef}
                    />
                </nav>
            )}
        </header>
    );
}
