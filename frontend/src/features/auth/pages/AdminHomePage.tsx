import { Layout } from '@/components/layout/Layout';
import { DepartmentsPage } from '@/features/departments/pages/DepartmentsPage';
import { type AuthUser } from '../types';

type AdminHomePageProps = {
    user: AuthUser;
    onLogout: () => void;
};

export function AdminHomePage({ user, onLogout }: AdminHomePageProps) {
    return (
        <Layout title="Departments" user={user} onLogout={onLogout}>
            <DepartmentsPage />
        </Layout>
    );
}
