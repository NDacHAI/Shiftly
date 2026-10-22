import { roles, type Role } from '@/constants/roles';
import { EmployeeDashboard } from './EmployeeDashboard';
import { ManagerDashboard } from './ManagerDashboard';

type DashboardPageProps = {
    userRole: Role;
    userName: string;
};

export function DashboardPage({ userRole, userName }: DashboardPageProps) {
    if (userRole === roles.user) {
        return <EmployeeDashboard />;
    }

    return <ManagerDashboard userName={userName} />;
}
