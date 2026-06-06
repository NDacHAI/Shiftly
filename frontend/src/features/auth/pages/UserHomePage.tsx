import { Layout } from '@/components/layout/Layout';
import { type AuthUser } from '../types';

type UserHomePageProps = {
    user: AuthUser;
    onLogout: () => void;
};

export function UserHomePage({ user, onLogout }: UserHomePageProps) {
    return (
        <Layout title="Dashboard" user={user} onLogout={onLogout}>
            <section className="p-8">
                <h2 className="text-2xl font-bold text-slate-900">
                    Lịch làm việc của tôi
                </h2>
            </section>
        </Layout>
    );
}
