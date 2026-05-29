import { useState, type FormEvent } from 'react';
import { login } from '../api/auth.api';
import { type AuthResponse } from '../types';

type LoginPageProps = {
    onLoginSuccess: (response: AuthResponse) => void;
};

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
    const [email, setEmail] = useState('admin@admin.com');
    const [password, setPassword] = useState('admin123');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const response = await login({ email, password });
            onLoginSuccess(response);
        } catch (loginError) {
            setError(
                loginError instanceof Error
                    ? loginError.message
                    : 'Không thể đăng nhập',
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="login-page">
            <form className="login-form" onSubmit={handleSubmit}>
                <div>
                    <p className="eyebrow">Shiftly</p>
                    <h1>Đăng nhập</h1>
                </div>

                <label>
                    Email
                    <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="email"
                        required
                    />
                </label>

                <label>
                    Mật khẩu
                    <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete="current-password"
                        minLength={6}
                        required
                    />
                </label>

                {error ? <p className="form-error">{error}</p> : null}

                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </button>
            </form>
        </main>
    );
}
