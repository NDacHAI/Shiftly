import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { routes } from '@/constants/routes';
import { logout } from '@/features/auth/api/auth.api';
import { ChangePasswordPage } from '@/features/auth/pages/ChangePasswordPage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { type AuthResponse, type AuthUser } from '@/features/auth/types';
import {
    clearAuthTokens,
    authUnauthorizedEvent,
    getStoredAuthState,
    saveAuthTokens,
} from '@/stores/auth.store';

type ProtectedRouteProps = {
    children: (auth: {
        user: AuthUser;
        onLogout: () => void;
    }) => ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const [authState, setAuthState] = useState(getStoredAuthState);
    const navigate = useNavigate();

    useEffect(() => {
        function handleUnauthorized() {
            setAuthState(getStoredAuthState());
            navigate(routes.dashboard, { replace: true });
        }

        window.addEventListener(authUnauthorizedEvent, handleUnauthorized);
        return () =>
            window.removeEventListener(
                authUnauthorizedEvent,
                handleUnauthorized,
            );
    }, [navigate]);

    function handleLoginSuccess(response: AuthResponse) {
        saveAuthTokens({
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
        });

        setAuthState(getStoredAuthState());
        navigate(routes.dashboard, { replace: true });
    }

    async function handleLogout() {
        try {
            await logout();
        } catch {
            // Local logout must still complete if the server is unavailable.
        }

        clearAuthTokens();
        setAuthState(getStoredAuthState());
        navigate(routes.dashboard, { replace: true });
    }

    if (!authState.user) {
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }

    if (authState.user.mustChangePassword) {
        return (
            <ChangePasswordPage
                onLogout={() => void handleLogout()}
                onPasswordChanged={() => {
                    clearAuthTokens();
                    setAuthState(getStoredAuthState());
                    navigate(routes.dashboard, { replace: true });
                }}
            />
        );
    }

    return children({
        user: authState.user,
        onLogout: () => void handleLogout(),
    });
}
