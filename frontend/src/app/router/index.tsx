import { Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { routes } from '@/constants/routes';
import { roles } from '@/constants/roles';
import { type AuthUser } from '@/features/auth/types';
import { DepartmentsPage } from '@/features/departments/pages/DepartmentsPage';
import { EmployeeDetailPage } from '@/features/employees/pages/EmployeeDetailPage';
import { EmployeesPage } from '@/features/employees/pages/EmployeesPage';
import { PositionsPage } from '@/features/positions/pages/PositionsPage';
import { PermissionRoute } from '@/guards/PermissionRoute';
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
                    <PermissionRoute
                        allowedRoles={[roles.admin]}
                        userRole={user.role}
                    >
                        <Layout
                            title="Departments"
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
                            title="Positions"
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
                            title="Employees"
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
                            title="Employee Details"
                            user={user}
                            onLogout={onLogout}
                        >
                            <EmployeeDetailPage />
                        </Layout>
                    </PermissionRoute>
                }
            />
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}
