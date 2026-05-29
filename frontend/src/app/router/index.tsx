import { useState } from 'react';
import { roles } from '@/constants/roles';
import { AdminHomePage } from '@/features/auth/pages/AdminHomePage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { ManagerHomePage } from '@/features/auth/pages/ManagerHomePage';
import { UserHomePage } from '@/features/auth/pages/UserHomePage';
import {
    clearAuthTokens,
    getStoredAuthState,
    saveAuthTokens,
    type AuthState,
} from '@/stores/auth.store';
import { type AuthResponse } from '@/features/auth/types';

export function AppRouter() {
    const [authState, setAuthState] = useState<AuthState>(getStoredAuthState);

    function handleLoginSuccess(response: AuthResponse) {
        saveAuthTokens({
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
        });

        setAuthState(getStoredAuthState());
    }

    function handleLogout() {
        clearAuthTokens();
        setAuthState(getStoredAuthState());
    }

    if (!authState.user) {
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }

    if (authState.user.role === roles.admin) {
        return (
            <AdminHomePage user={authState.user} onLogout={handleLogout} />
        );
    }

    if (authState.user.role === roles.manager) {
        return (
            <ManagerHomePage user={authState.user} onLogout={handleLogout} />
        );
    }

    return <UserHomePage user={authState.user} onLogout={handleLogout} />;
}
