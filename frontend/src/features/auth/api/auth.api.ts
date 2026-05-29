import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import { type AuthResponse } from '../types';

type LoginPayload = {
    email: string;
    password: string;
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
