import { useState, type FormEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEnvelope,
    faLock,
    faRightToBracket,
    faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { login } from '../api/auth.api';
import { type AuthResponse } from '../types';

type LoginPageProps = {
    onLoginSuccess: (response: AuthResponse) => void;
};

const inputClass =
    'h-12 w-full rounded-lg border border-slate-200 bg-white pr-4 pl-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100';

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 p-6">
            <div className="pointer-events-none absolute -top-32 -left-32 size-96 rounded-full bg-violet-200/50 blur-3xl" />
            <div className="pointer-events-none absolute -right-32 -bottom-32 size-96 rounded-full bg-indigo-200/50 blur-3xl" />

            <form
                autoComplete="off"
                className="relative z-10 grid w-full max-w-md gap-6 rounded-2xl border border-white/80 bg-white/95 p-8 shadow-[0_24px_70px_rgba(30,41,59,0.12)] backdrop-blur sm:p-10"
                onSubmit={handleSubmit}
            >
                <div className="text-center">
                    <div className="mb-5 inline-flex items-center gap-3">
                        <span className="relative flex size-9 rotate-45 items-center justify-center rounded-lg bg-violet-600 shadow-lg shadow-violet-200 after:size-3 after:rounded-sm after:bg-white after:content-['']" />
                        <strong className="text-2xl tracking-[-0.7px] text-slate-950">
                            Shiftly
                        </strong>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                        Đăng nhập
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Đăng nhập để tiếp tục quản lý công việc.
                    </p>
                </div>

                <div className="grid gap-4">
                    <label className="grid gap-2 text-sm font-semibold text-slate-700">
                        Email
                        <span className="relative">
                            <FontAwesomeIcon
                                className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400"
                                icon={faEnvelope}
                            />
                            <input
                                autoComplete="off"
                                className={inputClass}
                                placeholder="name@example.com"
                                required
                                type="email"
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                            />
                        </span>
                    </label>

                    <label className="grid gap-2 text-sm font-semibold text-slate-700">
                        Mật khẩu
                        <span className="relative">
                            <FontAwesomeIcon
                                className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400"
                                icon={faLock}
                            />
                            <input
                                autoComplete="new-password"
                                className={inputClass}
                                minLength={6}
                                placeholder="Nhập mật khẩu"
                                required
                                type="password"
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                            />
                        </span>
                    </label>
                </div>

                {error && (
                    <p
                        className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                        role="alert"
                    >
                        {error}
                    </p>
                )}

                <button
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 focus:ring-4 focus:ring-violet-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isSubmitting}
                    type="submit"
                >
                    <FontAwesomeIcon
                        className={isSubmitting ? 'animate-spin' : ''}
                        icon={isSubmitting ? faSpinner : faRightToBracket}
                    />
                    {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </button>
            </form>
        </main>
    );
}
