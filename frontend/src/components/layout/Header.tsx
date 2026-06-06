import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBell,
    faChevronDown,
    faRightFromBracket,
    faSearch,
    faUser,
} from '@fortawesome/free-solid-svg-icons';
import { type AuthUser } from '@/features/auth/types';

type HeaderProps = {
    title: string;
    user: AuthUser;
    onLogout: () => void;
};

export function Header({ title, user, onLogout }: HeaderProps) {
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
        <header className="flex min-h-[104px] items-center justify-between gap-6 border-b border-slate-200 bg-white px-4 py-2 max-md:items-start max-md:px-5 max-sm:flex-col">
            <h1 className="text-4xl font-bold tracking-[-0.25px] text-slate-950">
                {title}
            </h1>

            <div className="flex items-center gap-4 max-sm:w-full">
                <label className="relative block w-60 max-sm:flex-1">
                    <span className="sr-only">Search</span>
                    <FontAwesomeIcon
                        className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400"
                        icon={faSearch}
                    />
                    <input
                        className="h-10 min-h-0 rounded-md border-slate-200 bg-white pr-3 pl-9 text-sm font-normal shadow-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                        placeholder="Search..."
                        type="search"
                    />
                </label>

                <button
                    aria-label="Thông báo"
                    className="relative flex size-10 min-h-0 items-center justify-center bg-transparent p-0 text-slate-600 transition-colors hover:bg-violet-50 hover:text-violet-600"
                    type="button"
                >
                    <FontAwesomeIcon className="size-5" icon={faBell} />
                    <span className="absolute top-0 right-0 flex size-4 items-center justify-center rounded-full bg-violet-600 text-[9px] font-bold text-white">
                        3
                    </span>
                </button>

                <div className="relative" ref={profileRef}>
                    <button
                        aria-expanded={profileOpen}
                        aria-haspopup="menu"
                        className="flex min-h-0 items-center gap-2 bg-transparent p-1 text-slate-700 transition-colors hover:bg-slate-100"
                        onClick={() => setProfileOpen((open) => !open)}
                        type="button"
                    >
                        <span className="flex size-9 items-center justify-center rounded-full bg-violet-600 text-sm font-extrabold text-white">
                            {displayName.charAt(0).toUpperCase()}
                        </span>
                        <FontAwesomeIcon
                            className={`size-3.5 transition-transform ${profileOpen ? 'rotate-180' : ''
                                }`}
                            icon={faChevronDown}
                        />
                    </button>

                    {profileOpen && (
                        <div
                            className="absolute top-[calc(100%+8px)] right-0 z-20 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-xl"
                            role="menu"
                        >
                            <a
                                className="flex items-center px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-violet-50 hover:text-violet-700"
                                href="#"
                                onClick={(event) => {
                                    event.preventDefault();
                                    setProfileOpen(false);
                                }}
                                role="menuitem"
                            >
                                <FontAwesomeIcon
                                    className="mr-2.5 w-4"
                                    icon={faUser}
                                />
                                Trang cá nhân
                            </a>
                            <button
                                className="flex min-h-0 w-full items-center rounded-none bg-transparent px-4 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                                onClick={onLogout}
                                role="menuitem"
                                type="button"
                            >
                                <FontAwesomeIcon
                                    className="mr-2.5 w-4"
                                    icon={faRightFromBracket}
                                />
                                Đăng xuất
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
