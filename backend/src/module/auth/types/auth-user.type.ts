import { UserRole } from '@/common/enum/role.enum';

export type AuthUser = {
    id: number;
    email: string;
    role: UserRole;
    isActive: boolean;
    employeeId: string | null;
    mustChangePassword: boolean;
    isMaster: boolean;
};

export type JwtPayload = {
    sub: number;
    email: string;
    role: UserRole;
    employeeId: string | null;
    mustChangePassword: boolean;
    isMaster: boolean;
};

export type AuthResponse = {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
};
