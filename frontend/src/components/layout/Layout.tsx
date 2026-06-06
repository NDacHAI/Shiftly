import { type ReactNode } from 'react';
import { type AuthUser } from '@/features/auth/types';
import { Header } from './Header';
import { Nav } from './Nav';

type LayoutProps = {
    children: ReactNode;
    title: string;
    user: AuthUser;
    onLogout: () => void;
};

export function Layout({
    children,
    title,
    user,
    onLogout,
}: LayoutProps) {
    return (
        <main className="grid min-h-screen grid-cols-[248px_minmax(0,1fr)] max-sm:block">
            <Nav defaultActiveItem={title} />
            <div className="min-w-0">
                <Header title={title} user={user} onLogout={onLogout} />
                {children}
            </div>
        </main>
    );
}
