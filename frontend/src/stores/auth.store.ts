import { decodeJwtPayload, isRole } from '@/features/auth/lib/token';
import { type AuthTokens, type AuthUser } from '@/features/auth/types';

type AuthState = {
    user: AuthUser | null;
    accessToken: string | null;
    refreshToken: string | null;
};

const initialAuthState: AuthState = {
    user: null,
    accessToken: null,
    refreshToken: null,
};

export const accessTokenKey = 'shiftly.accessToken';
export const refreshTokenKey = 'shiftly.refreshToken';
export const authUnauthorizedEvent = 'shiftly:auth-unauthorized';
export const apiErrorEvent = 'shiftly:api-error';

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
