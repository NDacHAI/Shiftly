import { type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { type AuthUser } from '@/features/auth/types';
import { type I18nKey } from '@/i18n';
import { Header } from './Header';

type LayoutProps = {
    activeNavKey?: I18nKey;
    children: ReactNode;
    titleKey: I18nKey;
    user: AuthUser;
    onLogout: () => void;
};

export function Layout({
    activeNavKey,
    children,
    titleKey,
    user,
    onLogout,
}: LayoutProps) {
    const { pathname } = useLocation();

    return (
        <div className="flex min-h-screen flex-col">
            <Header
                activeNavKey={activeNavKey ?? titleKey}
                user={user}
                onLogout={onLogout}
            />
            {/* Keyed so the fallback enter animation replays on every route change. */}
            <main className="page-transition min-w-0 flex-1" key={pathname}>
                {children}
            </main>
        </div>
    );
}
