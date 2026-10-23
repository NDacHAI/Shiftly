import { useEffect, useState, type FormEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { useI18n, type Language } from '@/i18n';
import { getApiErrorKey } from '@/lib/api-error';
import { login } from '../api/auth.api';
import { LoginScene } from '../components/LoginScene';
import { type AuthResponse } from '../types';

type LoginPageProps = {
    onLoginSuccess: (response: AuthResponse) => void;
};

type LoginView = 'login' | 'forgot';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClass =
    'h-[46px] w-full rounded-[10px] border bg-paper px-3.5 text-[15px] text-ink outline-none transition-colors placeholder:text-faint focus:border-ink focus:bg-white';

const eyebrowClass = 'tabular-nums text-xs tracking-[0.04em] text-muted uppercase';

function formatVietnamClock(date: Date, language: Language, suffix: string) {
    const parts = new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-GB', {
        timeZone: 'Asia/Ho_Chi_Minh',
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(date);
    const part = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((item) => item.type === type)?.value ?? '';

    return `${part('weekday')} · ${part('day')}.${part('month')} · ${part('hour')}:${part('minute')}:${part('second')} ${suffix}`.toUpperCase();
}

// Sign-in screen from frontend/ui/Shiftly Dang nhap.html.
export function LoginPage({ onLoginSuccess }: LoginPageProps) {
    const { language, t } = useI18n();
    const [view, setView] = useState<LoginView>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [touched, setTouched] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [authError, setAuthError] = useState('');
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const intervalId = window.setInterval(() => setNow(new Date()), 1000);
        return () => window.clearInterval(intervalId);
    }, []);

    const trimmedEmail = email.trim();
    const emailError = !trimmedEmail
        ? t('login.emailRequired')
        : emailPattern.test(trimmedEmail)
          ? ''
          : t('login.emailInvalid');
    const showEmailError = touched && Boolean(emailError);
    const showPasswordError = touched && !password;

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (isSubmitting) return;

        setTouched(true);
        if (emailError || !password) return;

        setIsSubmitting(true);
        setAuthError('');

        try {
            const response = await login({ email: trimmedEmail, password });
            onLoginSuccess(response);
        } catch (loginError) {
            setAuthError(
                t(getApiErrorKey(loginError, 'common.apiErrors.invalidCredentials')),
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    function changeView(next: LoginView) {
        setView(next);
        setTouched(false);
        setAuthError('');
    }

    return (
        <main className="flex min-h-screen flex-wrap bg-sand text-ink">
            <section className="relative flex min-h-[440px] flex-[1.25_1_520px] flex-col justify-between overflow-hidden bg-ink px-11 py-9 text-sand max-sm:px-6">
                <LoginScene />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(23,22,15,0.85)_0%,rgba(23,22,15,0)_22%,rgba(23,22,15,0)_58%,rgba(23,22,15,0.92)_100%)]" />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(23,22,15,0.95)_0%,rgba(23,22,15,0.75)_38%,rgba(23,22,15,0)_68%)]" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-[linear-gradient(180deg,rgba(23,22,15,0)_0%,rgba(23,22,15,0.7)_45%,rgba(23,22,15,0.95)_100%)]" />

                <div className="relative flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                        <span className="grid size-[30px] place-items-center rounded-lg bg-ember">
                            <span className="size-[11px] rotate-45 bg-ink" />
                        </span>
                        <span className="text-[19px] font-bold tracking-[-0.02em]">Shiftly</span>
                    </div>
                    <span className="flex items-center gap-2 text-[11px] tracking-[0.06em] text-fog tabular-nums">
                        <span className="size-1.5 rounded-full bg-ember" />
                        {formatVietnamClock(now, language, t('login.vietnamTime'))}
                    </span>
                </div>

                <div className="relative flex max-w-[520px] flex-col gap-[18px]">
                    <h2 className="text-[clamp(32px,3.6vw,52px)] leading-[1.05] font-semibold tracking-[-0.035em] text-pretty">
                        {t('login.heroTitleLine1')}
                        <br />
                        {t('login.heroTitleLine2')}
                    </h2>
                    <p className="max-w-[420px] text-[15px] leading-relaxed text-[#c9c5b8] text-pretty">
                        {t('login.heroSubtitle')}
                    </p>
                </div>
            </section>

            <section className="flex flex-[1_1_420px] flex-col justify-center px-8 py-12 max-sm:px-4">
                <div className="mx-auto flex w-full max-w-[380px] flex-col gap-7">
                    {view === 'login' ? (
                        <div className="rise-enter flex flex-col gap-7" key="login">
                            <div className="flex flex-col gap-2">
                                <span className={eyebrowClass}>{t('login.eyebrow')}</span>
                                <h1 className="text-[30px] font-semibold tracking-[-0.03em]">
                                    {t('login.title')}
                                </h1>
                                <p className="text-sm text-muted">{t('login.subtitle')}</p>
                            </div>

                            <form className="flex flex-col gap-[18px]" noValidate onSubmit={handleSubmit}>
                                <label className="flex flex-col gap-1.5 text-[13px] font-medium">
                                    {t('login.email')}
                                    <input
                                        aria-invalid={showEmailError}
                                        autoComplete="email"
                                        className={`${inputClass} ${showEmailError ? 'border-ember-strong' : 'border-rule-strong'}`}
                                        placeholder={t('login.emailPlaceholder')}
                                        type="email"
                                        value={email}
                                        onChange={(event) => {
                                            setEmail(event.target.value);
                                            setAuthError('');
                                        }}
                                    />
                                    {showEmailError && (
                                        <span className="text-xs font-normal text-ember-strong">
                                            {emailError}
                                        </span>
                                    )}
                                </label>

                                <div className="flex flex-col gap-1.5 text-[13px] font-medium">
                                    <span className="flex items-baseline justify-between">
                                        <label htmlFor="login-password">{t('login.password')}</label>
                                        <button
                                            className="min-h-0 cursor-pointer border-0 bg-transparent p-0 text-xs font-medium text-muted transition-colors hover:text-ember-strong"
                                            type="button"
                                            onClick={() => changeView('forgot')}
                                        >
                                            {t('login.forgotPassword')}
                                        </button>
                                    </span>
                                    <div className="relative">
                                        <input
                                            aria-invalid={showPasswordError || Boolean(authError)}
                                            autoComplete="current-password"
                                            className={`${inputClass} pr-12 ${
                                                showPasswordError || authError ? 'border-ember-strong' : 'border-rule-strong'
                                            }`}
                                            id="login-password"
                                            placeholder={t('login.passwordPlaceholder')}
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(event) => {
                                                setPassword(event.target.value);
                                                setAuthError('');
                                            }}
                                        />
                                        <button
                                            aria-label={showPassword ? t('login.hidePasswordAria') : t('login.showPasswordAria')}
                                            aria-pressed={showPassword}
                                            className="absolute top-[7px] right-1.5 grid size-8 min-h-0 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-sm text-muted transition-colors hover:bg-stone hover:text-ink"
                                            title={showPassword ? t('login.hidePasswordAria') : t('login.showPasswordAria')}
                                            type="button"
                                            onClick={() => setShowPassword((visible) => !visible)}
                                        >
                                            <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                                        </button>
                                    </div>
                                    {showPasswordError && (
                                        <span className="text-xs font-normal text-ember-strong">
                                            {t('login.passwordRequired')}
                                        </span>
                                    )}
                                </div>

                                {authError && (
                                    <div
                                        className="rounded-[10px] bg-ember-tint px-3.5 py-3 text-[13px] leading-normal text-ember-ink"
                                        role="alert"
                                    >
                                        {authError}
                                    </div>
                                )}

                                <button
                                    className="mt-1 flex h-12 min-h-0 cursor-pointer items-center justify-center gap-2.5 rounded-[10px] border-0 bg-ink text-[15px] font-semibold text-sand transition-colors hover:bg-ink-soft disabled:cursor-wait disabled:opacity-80"
                                    disabled={isSubmitting}
                                    type="submit"
                                >
                                    {isSubmitting && (
                                        <span className="size-3.5 animate-spin rounded-full border-2 border-muted border-t-sand" />
                                    )}
                                    {isSubmitting ? t('login.submitting') : t('login.submit')}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="rise-enter flex flex-col gap-7" key="forgot">
                            <button
                                className="min-h-0 cursor-pointer self-start border-0 bg-transparent p-0 text-[13px] text-muted transition-colors hover:text-ink"
                                type="button"
                                onClick={() => changeView('login')}
                            >
                                {t('login.backToLogin')}
                            </button>
                            <div className="flex flex-col gap-2">
                                <span className={eyebrowClass}>{t('login.forgotEyebrow')}</span>
                                <h1 className="text-[30px] font-semibold tracking-[-0.03em]">
                                    {t('login.forgotTitle')}
                                </h1>
                                <p className="text-sm leading-relaxed text-muted text-pretty">
                                    {t('login.forgotDescription')}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="border-t border-rule pt-5 text-xs text-muted">
                        {t('login.help')}
                    </div>
                </div>
            </section>
        </main>
    );
}
