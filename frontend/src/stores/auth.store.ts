import { decodeJwtPayload, isRole } from '@/features/auth/lib/token';
import { type AuthTokens, type AuthUser } from '@/features/auth/types';

export type AuthState = {
    user: AuthUser | null;
    accessToken: string | null;
    refreshToken: string | null;
};

export const initialAuthState: AuthState = {
    user: null,
    accessToken: null,
    refreshToken: null,
};

const accessTokenKey = 'shiftly.accessToken';
const refreshTokenKey = 'shiftly.refreshToken';

export function saveAuthTokens(tokens: AuthTokens) {
    localStorage.setItem(accessTokenKey, tokens.accessToken);
    localStorage.setItem(refreshTokenKey, tokens.refreshToken);
}

export function clearAuthTokens() {
    localStorage.removeItem(accessTokenKey);
    localStorage.removeItem(refreshTokenKey);
}

export function getStoredAuthState(): AuthState {
    const accessToken = localStorage.getItem(accessTokenKey);
    const refreshToken = localStorage.getItem(refreshTokenKey);

    if (!accessToken) {
        return initialAuthState;
    }

    const payload = decodeJwtPayload(accessToken);

    if (!payload || !isRole(payload.role)) {
        clearAuthTokens();
        return initialAuthState;
    }

    return {
        accessToken,
        refreshToken,
        user: {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
            isActive: true,
        },
    };
}
