import { type Role } from '@/constants/roles';

export type AuthUser = {
    id: number;
    email: string;
    role: Role;
    isActive: boolean;
    employeeId: string | null;
    mustChangePassword: boolean;
    isMaster: boolean;
};

export type AuthTokens = {
    accessToken: string;
    refreshToken: string;
};

export type AuthResponse = AuthTokens & {
    user: AuthUser;
};

export type JwtPayload = {
    sub: number;
    email: string;
    role: Role;
    employeeId?: string | null;
    mustChangePassword?: boolean;
    isMaster?: boolean;
    exp?: number;
};
