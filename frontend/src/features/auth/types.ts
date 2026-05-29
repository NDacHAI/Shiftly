import { type Role } from '@/constants/roles';

export type AuthUser = {
    id: number;
    email: string;
    role: Role;
    isActive: boolean;
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
    exp?: number;
};
