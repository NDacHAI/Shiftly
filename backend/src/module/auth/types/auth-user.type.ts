import { UserRole } from '@/common/enum/role.enum';

export type AuthUser = {
    id: number;
    email: string;
    role: UserRole;
    isActive: boolean;
};

export type JwtPayload = {
    sub: number;
    email: string;
    role: UserRole;
};

export type AuthResponse = {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
};
