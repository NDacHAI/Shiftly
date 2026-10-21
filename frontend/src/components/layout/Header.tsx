import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBell,
    faChevronDown,
    faChevronRight,
    faRightFromBracket,
    faSearch,
    faUser,
} from '@fortawesome/free-solid-svg-icons';
import { type AuthUser } from '@/features/auth/types';
import { useI18n } from '@/i18n';

type HeaderProps = {
    groupLabel?: string;
    title: string;
    user: AuthUser;
    onLogout: () => void;
};

export function Header({ groupLabel, title, user, onLogout }: HeaderProps) {
    const { t } = useI18n();
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const displayName = user.email.split('@')[0];

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
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-6 border-b border-line bg-white/85 px-6 backdrop-blur-md max-sm:static max-sm:h-auto max-sm:flex-col max-sm:items-stretch max-sm:gap-3 max-sm:px-4 max-sm:py-3">
            <nav aria-label="Breadcrumb" className="min-w-0">
                <ol className="flex items-center gap-2 text-sm">
                    {groupLabel && (
                        <>
                            <li className="truncate text-slate-500">{groupLabel}</li>
                            <li aria-hidden="true" className="text-[10px] text-slate-300">
                                <FontAwesomeIcon icon={faChevronRight} />
                            </li>
                        </>
                    )}
                    <li>
                        <h1 className="truncate text-sm font-semibold text-slate-900">
                            {title}
                        </h1>
                    </li>
                </ol>
            </nav>

            <div className="flex items-center gap-2 max-sm:w-full">
                <label className="relative mr-2 block w-64 max-sm:flex-1">
                    <span className="sr-only">{t('common.search')}</span>
                    <FontAwesomeIcon
                        className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400"
                        icon={faSearch}
                    />
                    <input
                        className="h-9 min-h-0 w-full rounded-lg border border-transparent bg-slate-100 pr-3 pl-9 text-sm font-normal text-slate-800 outline-none transition placeholder:text-slate-400 hover:bg-slate-200/70 focus:border-primary-300 focus:bg-white focus:ring-3 focus:ring-primary-100"
                        placeholder={t('common.searchPlaceholder')}
                        type="search"
                    />
                </label>

                <button
                    aria-label={t('header.notifications')}
                    className="relative flex size-9 min-h-0 cursor-pointer items-center justify-center rounded-lg bg-transparent p-0 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                    type="button"
                >
                    <FontAwesomeIcon className="size-4" icon={faBell} />
                    <span className="absolute top-1.5 right-1.5 flex size-2 rounded-full bg-red-500 ring-2 ring-white" />
                </button>

                <span aria-hidden="true" className="mx-1 h-6 w-px bg-slate-200 max-sm:hidden" />

                <div className="relative" ref={profileRef}>
                    <button
                        aria-expanded={profileOpen}
                        aria-haspopup="menu"
                        className="flex min-h-0 cursor-pointer items-center gap-2.5 rounded-lg bg-transparent py-1 pr-2 pl-1 text-slate-700 transition-colors hover:bg-slate-100"
                        onClick={() => setProfileOpen((open) => !open)}
                        type="button"
                    >
                        <span className="flex size-8 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                            {displayName.charAt(0).toUpperCase()}
                        </span>
                        <span className="max-w-32 truncate text-sm font-medium text-slate-700 max-md:hidden">
                            {displayName}
                        </span>
                        <FontAwesomeIcon
                            className={`size-2.5 text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''
                                }`}
                            icon={faChevronDown}
                        />
                    </button>

                    {profileOpen && (
                        <div
                            className="absolute top-[calc(100%+6px)] right-0 z-20 w-56 overflow-hidden rounded-xl border border-line bg-white p-1 shadow-xl"
                            role="menu"
                        >
                            <div className="border-b border-slate-100 px-3 pt-2 pb-2.5">
                                <p className="truncate text-sm font-semibold text-slate-900">
                                    {displayName}
                                </p>
                                <p className="truncate text-xs text-slate-500">
                                    {user.email}
                                </p>
                            </div>
                            <a
                                className="mt-1 flex items-center rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
                                href="#"
                                onClick={(event) => {
                                    event.preventDefault();
                                    setProfileOpen(false);
                                }}
                                role="menuitem"
                            >
                                <FontAwesomeIcon
                                    className="mr-2.5 w-4 text-slate-400"
                                    icon={faUser}
                                />
                                {t('header.profile')}
                            </a>
                            <button
                                className="flex min-h-0 w-full cursor-pointer items-center rounded-md bg-transparent px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                                onClick={onLogout}
                                role="menuitem"
                                type="button"
                            >
                                <FontAwesomeIcon
                                    className="mr-2.5 w-4"
                                    icon={faRightFromBracket}
                                />
                                {t('header.logout')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
