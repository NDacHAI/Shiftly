import { roles, type Role } from '@/constants/roles';
import { EmployeeDashboard } from './EmployeeDashboard';
import { ManagerDashboard } from './ManagerDashboard';

type DashboardPageProps = {
    userRole: Role;
};

export function DashboardPage({ userRole }: DashboardPageProps) {
    if (userRole === roles.user) {
        return <EmployeeDashboard />;
    }

    return <ManagerDashboard />;
}
