export const roles = {
    admin: 'admin',
    manager: 'manager',
    user: 'user',
} as const;

export type Role = (typeof roles)[keyof typeof roles];
