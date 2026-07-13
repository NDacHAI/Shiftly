import { type ReactNode, useState } from 'react';
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
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <main
            className={`grid min-h-screen transition-[grid-template-columns] duration-200 max-sm:block ${
                sidebarCollapsed
                    ? 'grid-cols-[80px_minmax(0,1fr)]'
                    : 'grid-cols-[288px_minmax(0,1fr)]'
            }`}
        >
            <Nav
                collapsed={sidebarCollapsed}
                defaultActiveItem={activeNavKey ?? titleKey}
                userRole={user.role}
                onToggleCollapsed={() => setSidebarCollapsed((current) => !current)}
            />
            <div className="min-w-0">
                <Header title={title} user={user} onLogout={onLogout} />
                {children}
            </div>
        </main>
    );
}
