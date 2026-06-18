import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '@/components/feedback';
import { ProtectedRoute } from '@/guards/ProtectedRoute';
import { I18nProvider } from '@/i18n';
import { AppRouter } from './router';

export default function App() {
    return (
        <I18nProvider>
            <ToastProvider>
                <BrowserRouter>
                    <ProtectedRoute>
                        {({ user, onLogout }) => (
                            <AppRouter user={user} onLogout={onLogout} />
                        )}
                    </ProtectedRoute>
                </BrowserRouter>
            </ToastProvider>
        </I18nProvider>
    );
}
