import { Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { routes } from '@/constants/routes';
import { roles } from '@/constants/roles';
import { type AuthUser } from '@/features/auth/types';
import { DepartmentsPage } from '@/features/departments/pages/DepartmentsPage';
import { EmployeeDetailPage } from '@/features/employees/pages/EmployeeDetailPage';
import { EmployeesPage } from '@/features/employees/pages/EmployeesPage';
import { PositionsPage } from '@/features/positions/pages/PositionsPage';
import { SettingsPage } from '@/features/settings/pages/SettingsPage';
import { PermissionRoute } from '@/guards/PermissionRoute';
import { DashboardPage } from '@/pages/DashboardPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import WorkShiftPage from '@/features/work-shifts/pages/WorkShiftPage';

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
                        activeNavKey="nav.dashboard"
                        titleKey="routes.dashboard"
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
                    <PermissionRoute
                        allowedRoles={[roles.admin]}
                        userRole={user.role}
                    >
                        <Layout
                            activeNavKey="nav.departments"
                            titleKey="routes.departments"
                            user={user}
                            onLogout={onLogout}
                        >
                            <DepartmentsPage />
                        </Layout>
                    </PermissionRoute>
                }
            />
            <Route
                path={routes.positions}
                element={
                    <PermissionRoute
                        allowedRoles={[roles.admin, roles.manager]}
                        userRole={user.role}
                    >
                        <Layout
                            activeNavKey="nav.positions"
                            titleKey="routes.positions"
                            user={user}
                            onLogout={onLogout}
                        >
                            <PositionsPage
                                canManage={user.role === roles.admin}
                            />
                        </Layout>
                    </PermissionRoute>
                }
            />
            <Route
                path={routes.employees}
                element={
                    <PermissionRoute
                        allowedRoles={[
                            roles.admin,
                            roles.manager,
                            roles.user,
                        ]}
                        userRole={user.role}
                    >
                        <Layout
                            activeNavKey="nav.employees"
                            titleKey="routes.employees"
                            user={user}
                            onLogout={onLogout}
                        >
                            <EmployeesPage userRole={user.role} />
                        </Layout>
                    </PermissionRoute>
                }
            />
            <Route
                path={routes.employeeDetail}
                element={
                    <PermissionRoute
                        allowedRoles={[
                            roles.admin,
                            roles.manager,
                            roles.user,
                        ]}
                        userRole={user.role}
                    >
                        <Layout
                            activeNavKey="nav.employees"
                            titleKey="routes.employeeDetails"
                            user={user}
                            onLogout={onLogout}
                        >
                            <EmployeeDetailPage userRole={user.role} />
                        </Layout>
                    </PermissionRoute>
                }
            />
            <Route
                path={routes.settings}
                element={
                    <Layout
                        activeNavKey="nav.settings"
                        titleKey="routes.settings"
                        user={user}
                        onLogout={onLogout}
                    >
                        <SettingsPage />
                    </Layout>
                }
            />

            <Route
                path={routes.workShifts}
                element={
                    <Layout
                        activeNavKey="nav.workShifts"
                        titleKey="routes.workShifts"
                        user={user}
                        onLogout={onLogout}
                    >
                        <WorkShiftPage canManage={user.role === roles.admin} />
                    </Layout>
                }
            />
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}
