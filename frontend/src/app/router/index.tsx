import { Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { routes } from '@/constants/routes';
import { type AuthUser } from '@/features/auth/types';
import { DepartmentsPage } from '@/features/departments/pages/DepartmentsPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

type AppRouterProps = {
    user: AuthUser;
    onLogout: () => void;
};

export function AppRouter({ user, onLogout }: AppRouterProps) {
    return (
        <Routes>
            <Route
                path={routes.dashboard}
                element={
                    <Layout
                        title="Dashboard"
                        user={user}
                        onLogout={onLogout}
                    >
                        <DashboardPage />
                    </Layout>
                }
            />
            <Route
                path={routes.departments}
                element={
                    <Layout
                        title="Departments"
                        user={user}
                        onLogout={onLogout}
                    >
                        <DepartmentsPage />
                    </Layout>
                }
            />
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}
