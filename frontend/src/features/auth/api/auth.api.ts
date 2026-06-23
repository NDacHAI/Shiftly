import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import { type AuthResponse } from '../types';

type LoginPayload = {
    email: string;
    password: string;
};

type ChangePasswordPayload = {
    currentPassword: string;
    newPassword: string;
};

export async function login(payload: LoginPayload): Promise<AuthResponse> {
    try {
        const response = await api.post<AuthResponse>('/auth/login', payload);

        return response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            throw new Error('Email or password is invalid', {
                cause: error,
            });
        }

        throw error;
    }
}

export async function logout(): Promise<void> {
    await api.post('/auth/logout');
}

export async function changePassword(
    payload: ChangePasswordPayload,
): Promise<void> {
    try {
        await api.post('/auth/change-password', payload);
    } catch (error) {
        if (error instanceof AxiosError) {
            throw new Error('Current password is invalid', {
                cause: error,
            });
        }

        throw error;
    }
}
