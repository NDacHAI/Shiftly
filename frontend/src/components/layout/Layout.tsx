import { type ReactNode } from 'react';
import { type AuthUser } from '@/features/auth/types';
import { type I18nKey, useI18n } from '@/i18n';
import { Header } from './Header';
import { Nav } from './Nav';

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
    const { t } = useI18n();
    const title = t(titleKey);

    return (
        <main className="grid min-h-screen grid-cols-[248px_minmax(0,1fr)] max-sm:block">
            <Nav
                key={activeNavKey ?? titleKey}
                defaultActiveItem={activeNavKey ?? titleKey}
                userRole={user.role}
            />
            <div className="min-w-0">
                <Header title={title} user={user} onLogout={onLogout} />
                {children}
            </div>
        </main>
    );
}
