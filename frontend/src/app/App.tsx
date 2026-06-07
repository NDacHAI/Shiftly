import { BrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '@/guards/ProtectedRoute';
import { AppRouter } from './router';

export default function App() {
    return (
        <BrowserRouter>
            <ProtectedRoute>
                {({ user, onLogout }) => (
                    <AppRouter user={user} onLogout={onLogout} />
                )}
            </ProtectedRoute>
        </BrowserRouter>
    );
}
