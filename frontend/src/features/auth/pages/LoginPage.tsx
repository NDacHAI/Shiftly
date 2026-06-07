import { useState, type FormEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChartSimple,
    faClock,
    faEnvelope,
    faEye,
    faEyeSlash,
    faLock,
    faRightToBracket,
    faSpinner,
    faCalendarDays,
} from '@fortawesome/free-solid-svg-icons';
import { login } from '../api/auth.api';
import { type AuthResponse } from '../types';

type LoginPageProps = {
    onLoginSuccess: (response: AuthResponse) => void;
};

const benefits = [
    { icon: faCalendarDays, label: 'Quản lý ca làm việc linh hoạt' },
    { icon: faClock, label: 'Chấm công nhanh chóng' },
    { icon: faChartSimple, label: 'Theo dõi và báo cáo giờ làm' },
];

const inputClass =
    'h-11 w-full rounded-lg border border-slate-200 bg-white pr-10 pl-10 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100';

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
        <main className="flex min-h-screen items-center justify-center bg-white p-4 sm:p-8">
            <section className="grid min-h-[min(620px,calc(100vh-64px))] w-full max-w-[1120px] overflow-hidden rounded-2xl bg-white shadow-[0_18px_60px_rgba(37,99,235,0.12)] lg:grid-cols-[58%_42%]">
                <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#d9e9ff] via-[#c9e0ff] to-[#a9ccff] px-10 py-8 lg:flex xl:px-12 xl:py-10">
                    <div className="pointer-events-none absolute -top-28 -right-24 size-72 rounded-full bg-white/20" />
                    <div className="pointer-events-none absolute right-12 top-16 grid grid-cols-6 gap-2.5 opacity-30">
                        {Array.from({ length: 24 }).map((_, index) => (
                            <span
                                className="size-1.5 rounded-full bg-white"
                                key={index}
                            />
                        ))}
                    </div>
                    <div className="pointer-events-none absolute -bottom-28 -left-28 h-52 w-[130%] rotate-3 rounded-[50%] bg-white/20" />

                    <div className="relative z-10 flex w-full max-w-[540px] flex-col">
                        <div
                            aria-label="Shiftly"
                            className="flex items-center gap-2"
                        >
                            <span
                                className="block h-[72px] w-[76px] shrink-0 bg-no-repeat"
                                style={{
                                    backgroundImage: "url('/logo.png')",
                                    backgroundPosition: '-37px -21px',
                                    backgroundSize: '132px 132px',
                                }}
                            />
                            <strong className="text-[42px] font-extrabold leading-none tracking-[-2px] text-[#0752a7]">
                                Shift
                                <span className="text-[#ff9f16]">ly</span>
                            </strong>
                        </div>

                        <div className="mt-4 max-w-[275px]">
                            <h2 className="text-[23px] font-extrabold leading-[1.3] tracking-[-0.5px] text-[#0d2045]">
                                Quản lý ca làm việc
                                <br />&amp; chấm công Part-time
                            </h2>
                            <div className="mt-4 h-0.5 w-12 bg-blue-600" />
                            <p className="mt-4 text-xs leading-5 text-slate-600">
                                Lập lịch làm việc, chấm công và theo dõi nhân sự
                                trên một nền tảng đơn giản, hiệu quả và dễ sử
                                dụng.
                            </p>
                        </div>

                        <div className="mt-4 w-[280px]">
                            {benefits.map((benefit) => (
                                <div
                                    className="flex items-center gap-3 border-b border-blue-300/70 py-3 last:border-0"
                                    key={benefit.label}
                                >
                                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs text-white shadow-md shadow-blue-300">
                                        <FontAwesomeIcon icon={benefit.icon} />
                                    </span>
                                    <span className="text-xs font-semibold text-[#172c50]">
                                        {benefit.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <img
                        alt="Minh họa quản lý ca làm việc và chấm công"
                        className="absolute right-[-11%] bottom-[8%] z-10 w-[76%] max-w-[500px] mix-blend-multiply drop-shadow-[0_16px_20px_rgba(30,100,220,0.18)] xl:right-[-7%]"
                        src="/illustration_login.png"
                    />
                </div>

                <div className="flex items-center justify-center bg-white px-6 py-9 sm:px-10 lg:px-12 xl:px-14">
                    <form
                        className="w-full max-w-[350px]"
                        onSubmit={handleSubmit}
                    >
                        <div
                            aria-label="Shiftly"
                            className="mx-auto mb-7 flex w-fit items-center gap-2 lg:hidden"
                        >
                            <span
                                className="block h-16 w-[68px] shrink-0 bg-no-repeat"
                                style={{
                                    backgroundImage: "url('/logo.png')",
                                    backgroundPosition: '-33px -19px',
                                    backgroundSize: '118px 118px',
                                }}
                            />
                            <strong className="text-4xl font-extrabold leading-none tracking-[-2px] text-[#0752a7]">
                                Shift
                                <span className="text-[#ff9f16]">ly</span>
                            </strong>
                        </div>

                        <h1 className="text-2xl font-extrabold tracking-[-0.6px] text-[#0d2045]">
                            Đăng nhập
                        </h1>
                        <p className="mt-2 text-xs text-slate-500">
                            Đăng nhập để tiếp tục quản lý công việc.
                        </p>

                        <div className="mt-8 grid gap-5">
                            <label className="grid gap-2 text-xs font-semibold text-[#172c50]">
                                Email
                                <span className="relative">
                                    <FontAwesomeIcon
                                        className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400"
                                        icon={faEnvelope}
                                    />
                                    <input
                                        autoComplete="email"
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

                            <label className="grid gap-2 text-xs font-semibold text-[#172c50]">
                                Mật khẩu
                                <span className="relative">
                                    <FontAwesomeIcon
                                        className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400"
                                        icon={faLock}
                                    />
                                    <input
                                        autoComplete="current-password"
                                        className={inputClass}
                                        minLength={6}
                                        placeholder="Nhập mật khẩu"
                                        required
                                        type={
                                            showPassword ? 'text' : 'password'
                                        }
                                        value={password}
                                        onChange={(event) =>
                                            setPassword(event.target.value)
                                        }
                                    />
                                    <button
                                        aria-label={
                                            showPassword
                                                ? 'Ẩn mật khẩu'
                                                : 'Hiện mật khẩu'
                                        }
                                        className="absolute top-1/2 right-3.5 -translate-y-1/2 text-slate-400 transition hover:text-blue-600"
                                        type="button"
                                        onClick={() =>
                                            setShowPassword((visible) => !visible)
                                        }
                                    >
                                        <FontAwesomeIcon
                                            icon={
                                                showPassword ? faEyeSlash : faEye
                                            }
                                        />
                                    </button>
                                </span>
                            </label>
                        </div>

                        <label className="mt-4 flex w-fit cursor-pointer items-center gap-2 text-xs text-slate-600">
                            <input
                                className="size-3.5 accent-blue-600"
                                type="checkbox"
                            />
                            Ghi nhớ đăng nhập
                        </label>

                        {error && (
                            <p
                                className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                                role="alert"
                            >
                                {error}
                            </p>
                        )}

                        <button
                            className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 px-5 text-xs font-bold text-white shadow-lg shadow-blue-200 transition hover:from-blue-600 hover:to-blue-800 focus:ring-4 focus:ring-blue-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={isSubmitting}
                            type="submit"
                        >
                            <FontAwesomeIcon
                                className={isSubmitting ? 'animate-spin' : ''}
                                icon={
                                    isSubmitting
                                        ? faSpinner
                                        : faRightToBracket
                                }
                            />
                            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                        </button>

                        <button
                            className="mx-auto mt-5 block text-xs font-medium text-blue-600 transition hover:text-blue-800 hover:underline"
                            type="button"
                        >
                            Quên mật khẩu?
                        </button>
                    </form>
                </div>
            </section>
        </main>
    );
}
