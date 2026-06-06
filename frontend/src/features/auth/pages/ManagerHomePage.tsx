import { Layout } from '@/components/layout/Layout';
import { type AuthUser } from '../types';

type ManagerHomePageProps = {
    user: AuthUser;
    onLogout: () => void;
};

export function ManagerHomePage({ user, onLogout }: ManagerHomePageProps) {
    return (
        <Layout title="Dashboard" user={user} onLogout={onLogout}>
            <section className="p-8">
                <h2 className="text-2xl font-bold text-slate-900">
                    Quản lý ca làm
                </h2>
            </section>
        </Layout>
    );
}
