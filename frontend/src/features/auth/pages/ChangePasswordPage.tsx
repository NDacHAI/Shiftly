import { useEffect, useState, type FormEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { useI18n, type I18nKey } from '@/i18n';
import { getApiErrorKey } from '@/lib/api-error';
import { interpolate } from '@/features/dashboard/lib/format';
import { changePassword } from '../api/auth.api';
import { PasswordInput } from '../components/PasswordInput';
import { type AuthUser } from '../types';

type ChangePasswordPageProps = {
    user: AuthUser;
    onLogout: () => void;
    onPasswordChanged: () => void;
};

const redirectSeconds = 5;
const currentPasswordInvalidKey: I18nKey = 'common.apiErrors.currentPasswordInvalid';

const strengthLevels: Array<{ labelKey: I18nKey | null; color: string }> = [
    { labelKey: null, color: 'var(--color-stone)' },
    { labelKey: 'changePassword.strengthWeak', color: 'var(--color-ember-strong)' },
    { labelKey: 'changePassword.strengthFair', color: 'var(--color-ember)' },
    { labelKey: 'changePassword.strengthGood', color: 'var(--color-faint)' },
    { labelKey: 'changePassword.strengthStrong', color: 'var(--color-live)' },
];

function passwordChecks(password: string, current: string) {
    return [
        password.length >= 8,
        /[a-z]/.test(password) && /[A-Z]/.test(password),
        /\d/.test(password),
        /[^A-Za-z0-9]/.test(password),
        Boolean(password) && password !== current,
    ];
}

// Forced first-login password change (frontend/ui/Shiftly Doi mat khau.html).
export function ChangePasswordPage({
    user,
    onLogout,
    onPasswordChanged,
}: ChangePasswordPageProps) {
    const { t } = useI18n();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [touched, setTouched] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorKey, setErrorKey] = useState<I18nKey | null>(null);
    const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

    useEffect(() => {
        if (secondsLeft === null) return;

        const timeoutId = window.setTimeout(() => {
            if (secondsLeft <= 1) onPasswordChanged();
            else setSecondsLeft(secondsLeft - 1);
        }, 1000);

        return () => window.clearTimeout(timeoutId);
    }, [onPasswordChanged, secondsLeft]);

    const checks = passwordChecks(newPassword, currentPassword);
    const passed = checks.filter(Boolean).length;
    const score = !newPassword ? 0 : passed <= 2 ? 1 : passed === 3 ? 2 : passed === 4 ? 3 : 4;
    const strength = strengthLevels[score];
    const allPassed = passed === checks.length;
    const matches = Boolean(confirmPassword) && confirmPassword === newPassword;
    const ready = Boolean(currentPassword) && allPassed && matches;
    const currentWrong = errorKey === currentPasswordInvalidKey;
    const currentError =
        touched && !currentPassword
            ? t('changePassword.currentRequired')
            : currentWrong
              ? t(currentPasswordInvalidKey)
              : '';
    const showMismatch =
        Boolean(confirmPassword) &&
        !matches &&
        confirmPassword.length >= Math.min(newPassword.length, 3);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setTouched(true);
        if (!ready || isSubmitting) return;

        setIsSubmitting(true);
        setErrorKey(null);

        try {
            await changePassword({ currentPassword, newPassword });
            setSecondsLeft(redirectSeconds);
        } catch (changeError) {
            setErrorKey(
                getApiErrorKey(changeError, 'common.apiErrors.passwordChangeGeneric'),
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="flex min-h-screen flex-col bg-sand text-ink">
            <header className="flex items-center justify-between gap-4 px-8 py-[22px] max-sm:px-4">
                <div className="flex items-center gap-2.5">
                    <span className="grid size-7 place-items-center rounded-lg bg-ember">
                        <span className="size-2.5 rotate-45 bg-ink" />
                    </span>
                    <span className="text-lg font-bold tracking-[-0.02em]">Shiftly</span>
                </div>
                <div className="flex items-center gap-3.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <span className="grid size-8 flex-none place-items-center rounded-full bg-ink text-[13px] font-semibold text-sand uppercase">
                            {user.email.charAt(0)}
                        </span>
                        <span className="flex min-w-0 flex-col leading-tight max-sm:hidden">
                            <span className="text-[13px] font-semibold">{t(`header.roles.${user.role}`)}</span>
                            <span className="truncate text-[11px] text-muted">{user.email}</span>
                        </span>
                    </div>
                    <button
                        className="h-[34px] min-h-0 cursor-pointer rounded-lg border border-rule-strong bg-transparent px-3 text-[13px] font-medium text-ink transition-colors hover:bg-stone"
                        type="button"
                        onClick={onLogout}
                    >
                        {t('header.logout')}
                    </button>
                </div>
            </header>

            <main className="flex flex-1 items-center justify-center px-6 pt-4 pb-14 max-sm:px-4">
                <div className="w-full max-w-[480px] overflow-hidden rounded-[18px] border border-rule bg-paper">
                    {secondsLeft === null ? (
                        <form
                            className="flex min-w-0 flex-col gap-[26px] p-10 max-sm:p-6"
                            noValidate
                            onSubmit={handleSubmit}
                        >
                            <div className="flex flex-col gap-2">
                                <span className="flex items-center gap-[7px] self-start rounded-[5px] bg-ember-tint px-[9px] py-1 text-[11px] tracking-[0.06em] text-ember-ink uppercase">
                                    <span className="size-1.5 rounded-full bg-ember" />
                                    {t('changePassword.badge')}
                                </span>
                                <h1 className="mt-1.5 text-[30px] font-semibold tracking-[-0.03em]">
                                    {t('changePassword.title')}
                                </h1>
                                <p className="text-sm leading-relaxed text-muted text-pretty">
                                    {t('changePassword.subtitle')}
                                </p>
                            </div>

                            <div className="flex flex-col gap-[18px]">
                                <div className="flex flex-col gap-1.5 text-[13px] font-medium">
                                    <label htmlFor="current-password">
                                        {t('changePassword.currentPassword')}
                                    </label>
                                    <PasswordInput
                                        autoComplete="current-password"
                                        id="current-password"
                                        invalid={Boolean(currentError)}
                                        placeholder={t('changePassword.currentPlaceholder')}
                                        value={currentPassword}
                                        onChange={(value) => {
                                            setCurrentPassword(value);
                                            setErrorKey(null);
                                        }}
                                    />
                                    {currentError && (
                                        <span className="text-xs font-normal text-ember-strong">
                                            {currentError}
                                        </span>
                                    )}
                                </div>

                                <div className="h-px bg-rule-soft" />

                                <div className="flex flex-col gap-1.5 text-[13px] font-medium">
                                    <label htmlFor="new-password">{t('changePassword.newPassword')}</label>
                                    <PasswordInput
                                        autoComplete="new-password"
                                        id="new-password"
                                        invalid={touched && !allPassed}
                                        placeholder={t('changePassword.newPlaceholder')}
                                        value={newPassword}
                                        onChange={setNewPassword}
                                    />
                                    <div className="mt-1 flex items-center gap-2.5">
                                        <div className="grid flex-1 grid-cols-4 gap-1">
                                            {[1, 2, 3, 4].map((bar) => (
                                                <span
                                                    className="h-1 rounded-sm transition-colors duration-200"
                                                    key={bar}
                                                    style={{
                                                        background:
                                                            bar <= score ? strength.color : 'var(--color-stone)',
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <span
                                            className="min-w-16 text-right text-xs font-semibold"
                                            style={{ color: strength.color }}
                                        >
                                            {strength.labelKey ? t(strength.labelKey) : ''}
                                        </span>
                                    </div>
                                    {touched && !allPassed && (
                                        <span className="text-xs leading-normal font-normal text-ember-strong">
                                            {t('changePassword.requirements')}
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1.5 text-[13px] font-medium">
                                    <label htmlFor="confirm-password">
                                        {t('changePassword.confirmPassword')}
                                    </label>
                                    <PasswordInput
                                        autoComplete="new-password"
                                        id="confirm-password"
                                        invalid={Boolean(confirmPassword) && !matches}
                                        placeholder={t('changePassword.confirmPlaceholder')}
                                        valid={matches && allPassed}
                                        value={confirmPassword}
                                        onChange={setConfirmPassword}
                                    />
                                    {showMismatch && (
                                        <span className="text-xs font-normal text-ember-strong">
                                            {t('changePassword.mismatch')}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {errorKey && !currentWrong && (
                                <div
                                    className="rounded-[10px] bg-ember-tint px-3.5 py-3 text-[13px] leading-normal text-ember-ink"
                                    role="alert"
                                >
                                    {t(errorKey)}
                                </div>
                            )}

                            <button
                                aria-disabled={!ready}
                                className={`flex h-12 min-h-0 items-center justify-center gap-2.5 rounded-[10px] border-0 text-[15px] font-semibold transition-colors ${
                                    ready
                                        ? 'cursor-pointer bg-ink text-sand hover:bg-ink-soft'
                                        : 'cursor-not-allowed bg-stone text-faint'
                                }`}
                                disabled={isSubmitting}
                                type="submit"
                            >
                                {isSubmitting && (
                                    <span className="size-3.5 animate-spin rounded-full border-2 border-muted border-t-sand" />
                                )}
                                {isSubmitting ? t('changePassword.submitting') : t('changePassword.submit')}
                            </button>
                        </form>
                    ) : (
                        <div className="rise-enter flex min-w-0 flex-col justify-center gap-[22px] p-10 max-sm:p-6">
                            <span className="grid size-[52px] place-items-center rounded-full bg-[#dff0e4] text-xl text-[#1f6237]">
                                <FontAwesomeIcon icon={faCheck} />
                            </span>
                            <div className="flex flex-col gap-2">
                                <h1 className="text-[30px] font-semibold tracking-[-0.03em]">
                                    {t('changePassword.doneTitle')}
                                </h1>
                                <p className="text-sm leading-relaxed text-muted" aria-live="polite">
                                    {interpolate(t('changePassword.doneDescription'), {
                                        seconds: secondsLeft,
                                    })}
                                </p>
                            </div>
                            <button
                                className="flex h-[46px] min-h-0 cursor-pointer items-center self-start rounded-[10px] border-0 bg-ink px-[18px] text-sm font-semibold text-sand transition-colors hover:bg-ink-soft"
                                type="button"
                                onClick={onPasswordChanged}
                            >
                                {t('changePassword.doneAction')}
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
