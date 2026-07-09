import { Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { routes } from '@/constants/routes';
import { roles } from '@/constants/roles';
import { type AuthUser } from '@/features/auth/types';
import { BranchesPage } from '@/features/branches/pages/BranchesPage';
import { EmployeeDetailPage } from '@/features/employees/pages/EmployeeDetailPage';
import { EmployeesPage } from '@/features/employees/pages/EmployeesPage';
import { PositionsPage } from '@/features/positions/pages/PositionsPage';
import { SettingsPage } from '@/features/settings/pages/SettingsPage';
import { PermissionRoute } from '@/guards/PermissionRoute';
import { DashboardPage } from '@/pages/DashboardPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import WorkShiftPage from '@/features/work-shifts/pages/WorkShiftPage';
import { WorkSchedulesPage } from '@/features/work-schedules/pages/WorkSchedulesPage';
import { ShiftRequestsPage } from '@/features/shift-requests/pages/ShiftRequestsPage';

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
                path={routes.branches}
                element={
                    <PermissionRoute
                        allowedRoles={[roles.admin, roles.manager]}
                        userRole={user.role}
                    >
                        <Layout
                            activeNavKey="nav.branches"
                            titleKey="routes.branches"
                            user={user}
                            onLogout={onLogout}
                        >
                            <BranchesPage canManage={user.role === roles.admin} />
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
                    <PermissionRoute
                        allowedRoles={[roles.admin, roles.manager, roles.user]}
                        userRole={user.role}
                    >
                        <Layout
                            activeNavKey="nav.settings"
                            titleKey="routes.settings"
                            user={user}
                            onLogout={onLogout}
                        >
                            <SettingsPage />
                        </Layout>
                    </PermissionRoute>
                }
            />

            <Route
                path={routes.workShifts}
                element={
                    <PermissionRoute
                        allowedRoles={[roles.admin, roles.manager]}
                        userRole={user.role}
                    >
                        <Layout
                            activeNavKey="nav.workShifts"
                            titleKey="routes.workShifts"
                            user={user}
                            onLogout={onLogout}
                        >
                            <WorkShiftPage canManage={user.role === roles.admin} />
                        </Layout>
                    </PermissionRoute>
                }
            />
            <Route
                path={routes.workSchedules}
                element={
                    <PermissionRoute
                        allowedRoles={[roles.admin, roles.manager, roles.user]}
                        userRole={user.role}
                    >
                        <Layout
                            activeNavKey="nav.workSchedules"
                            titleKey="routes.workSchedules"
                            user={user}
                            onLogout={onLogout}
                        >
                            <WorkSchedulesPage userRole={user.role} />
                        </Layout>
                    </PermissionRoute>
                }
            />
            <Route
                path={routes.shiftRequests}
                element={
                    <PermissionRoute
                        allowedRoles={[roles.admin, roles.manager, roles.user]}
                        userRole={user.role}
                    >
                        <Layout
                            activeNavKey="nav.shiftRequests"
                            titleKey="routes.shiftRequests"
                            user={user}
                            onLogout={onLogout}
                        >
                            <ShiftRequestsPage userRole={user.role} />
                        </Layout>
                    </PermissionRoute>
                }
            />
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}
