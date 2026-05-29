import { type AuthUser } from '@/features/auth/types';

export type AuthState = {
    user: AuthUser | null;
    accessToken: string | null;
};

export const initialAuthState: AuthState = {
    user: null,
    accessToken: null,
};
