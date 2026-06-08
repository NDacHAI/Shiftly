import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '@/components/feedback';
import { ProtectedRoute } from '@/guards/ProtectedRoute';
import { AppRouter } from './router';

export default function App() {
    return (
        <ToastProvider>
            <BrowserRouter>
                <ProtectedRoute>
                    {({ user, onLogout }) => (
                        <AppRouter user={user} onLogout={onLogout} />
                    )}
                </ProtectedRoute>
            </BrowserRouter>
        </ToastProvider>
    );
}
