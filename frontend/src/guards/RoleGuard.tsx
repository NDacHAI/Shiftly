import { type ReactNode } from 'react';
import { type Role } from '@/constants/roles';

type RoleGuardProps = {
    allowedRoles: Role[];
    children: ReactNode;
};

export function RoleGuard({ children }: RoleGuardProps) {
    return children;
}
