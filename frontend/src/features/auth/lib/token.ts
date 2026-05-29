import { roles, type Role } from '@/constants/roles';
import { type JwtPayload } from '../types';

export function decodeJwtPayload(token: string): JwtPayload | null {
    try {
        const [, payload] = token.split('.');

        if (!payload) {
            return null;
        }

        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeURIComponent(
            window
                .atob(base64)
                .split('')
                .map((char) => {
                    return `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`;
                })
                .join(''),
        );

        return JSON.parse(json) as JwtPayload;
    } catch {
        return null;
    }
}

export function isRole(value: string | undefined): value is Role {
    return Object.values(roles).includes(value as Role);
}
