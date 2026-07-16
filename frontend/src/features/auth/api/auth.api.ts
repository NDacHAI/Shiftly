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
    const response = await api.post<AuthResponse>('/auth/login', payload);

    return response.data;
}

export async function logout(): Promise<void> {
    await api.post('/auth/logout');
}

export async function changePassword(
    payload: ChangePasswordPayload,
): Promise<void> {
    await api.post('/auth/change-password', payload);
}
