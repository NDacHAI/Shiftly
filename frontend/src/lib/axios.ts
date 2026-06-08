import axios, {
    AxiosError,
    type InternalAxiosRequestConfig,
} from 'axios';
import { type AuthResponse } from '@/features/auth/types';
import {
    accessTokenKey,
    apiErrorEvent,
    authUnauthorizedEvent,
    clearAuthTokens,
    refreshTokenKey,
    saveAuthTokens,
} from '@/stores/auth.store';

type RetryableRequestConfig = InternalAxiosRequestConfig & {
    _retry?: boolean;
};

const baseURL =
    import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000,
});

api.interceptors.request.use((config) => {
    const accessToken = localStorage.getItem(accessTokenKey);

    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
});

let refreshRequest: Promise<AuthResponse> | null = null;

async function refreshAuthTokens(): Promise<AuthResponse> {
    const refreshToken = localStorage.getItem(refreshTokenKey);

    if (!refreshToken) {
        throw new Error('Refresh token is missing');
    }

    refreshRequest ??= axios
        .post<AuthResponse>(
            `${baseURL}/auth/refresh`,
            { refreshToken },
            { timeout: 15000 },
        )
        .then((response) => {
            saveAuthTokens(response.data);
            return response.data;
        })
        .finally(() => {
            refreshRequest = null;
        });

    return refreshRequest;
}

function notifyApiError(status: number) {
    const messages: Record<number, string> = {
        403: 'Bạn không có quyền thực hiện thao tác này.',
        500: 'Máy chủ gặp lỗi. Vui lòng thử lại sau.',
    };

    const message = messages[status];

    if (message) {
        window.dispatchEvent(
            new CustomEvent(apiErrorEvent, {
                detail: { message, status },
            }),
        );
    }
}

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const status = error.response?.status;
        const originalRequest = error.config as
            | RetryableRequestConfig
            | undefined;
        const isAuthRequest = originalRequest?.url?.startsWith('/auth/');

        if (
            status === 401 &&
            originalRequest &&
            !originalRequest._retry &&
            !isAuthRequest
        ) {
            originalRequest._retry = true;

            try {
                const response = await refreshAuthTokens();
                originalRequest.headers.Authorization = `Bearer ${response.accessToken}`;
                return api(originalRequest);
            } catch {
                clearAuthTokens();
                window.dispatchEvent(new Event(authUnauthorizedEvent));
                return Promise.reject(error);
            }
        }

        if (status === 401 && !isAuthRequest) {
            clearAuthTokens();
            window.dispatchEvent(new Event(authUnauthorizedEvent));
        }

        if (status === 403 || status === 500) {
            notifyApiError(status);
        }

        return Promise.reject(error);
    },
);
