import { useEffect, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { routes } from '@/constants/routes';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { type AuthResponse, type AuthUser } from '@/features/auth/types';
import {
    clearAuthTokens,
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
    const location = useLocation();
    const navigate = useNavigate();
    const [initialRedirectPending, setInitialRedirectPending] = useState(
        () =>
            Boolean(authState.user) &&
            location.pathname === routes.departments,
    );

    useEffect(() => {
        if (!initialRedirectPending) {
            return;
        }

        navigate(routes.dashboard, { replace: true });
        const timeoutId = window.setTimeout(
            () => setInitialRedirectPending(false),
            0,
        );

        return () => window.clearTimeout(timeoutId);
    }, [initialRedirectPending, navigate]);

    function handleLoginSuccess(response: AuthResponse) {
        saveAuthTokens({
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
        });

        setAuthState(getStoredAuthState());
        navigate(routes.dashboard, { replace: true });
    }

    function handleLogout() {
        clearAuthTokens();
        setAuthState(getStoredAuthState());
        navigate(routes.dashboard, { replace: true });
    }

    if (!authState.user) {
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }

    if (initialRedirectPending) {
        return null;
    }

    return children({
        user: authState.user,
        onLogout: handleLogout,
    });
}
