import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { routes } from '@/constants/routes';
import { type Role } from '@/constants/roles';

type PermissionRouteProps = {
    allowedRoles: readonly Role[];
    children: ReactNode;
    userRole: Role;
};

export function PermissionRoute({
    allowedRoles,
    children,
    userRole,
}: PermissionRouteProps) {
    if (!allowedRoles.includes(userRole)) {
        return <Navigate replace to={routes.dashboard} />;
    }

    return children;
}
