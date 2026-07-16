import { useState, type FormEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faKey,
    faLock,
    faRightFromBracket,
    faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { useToast } from '@/components/feedback';
import { useI18n } from '@/i18n';
import { getApiErrorKey } from '@/lib/api-error';
import { changePassword } from '../api/auth.api';

type ChangePasswordPageProps = {
    onLogout: () => void;
    onPasswordChanged: () => void;
};

const inputClass =
    'min-h-11 rounded-lg border border-slate-200 bg-white pr-3 pl-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100';

export function ChangePasswordPage({
    onLogout,
    onPasswordChanged,
}: ChangePasswordPageProps) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showToast } = useToast();
    const { t } = useI18n();

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (newPassword !== confirmPassword) {
            showToast({
                message: t('common.apiErrors.passwordConfirmMismatch'),
                variant: 'error',
            });
            return;
        }

        setIsSubmitting(true);

        try {
            await changePassword({ currentPassword, newPassword });
            onPasswordChanged();
        } catch (changeError) {
            showToast({
                message: t(
                    getApiErrorKey(
                        changeError,
                        'common.apiErrors.passwordChangeGeneric',
                    ),
                ),
                variant: 'error',
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <form
                className="grid w-full max-w-[420px] gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                onSubmit={handleSubmit}
            >
                <div>
                    <div className="flex size-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <FontAwesomeIcon icon={faKey} />
                    </div>
                    <h1 className="mt-4 text-2xl font-extrabold text-slate-950">
                        Đổi mật khẩu
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        Bạn cần đặt mật khẩu mới trước khi tiếp tục sử dụng
                        Shiftly.
                    </p>
                </div>

                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                    Mật khẩu hiện tại
                    <span className="relative grid">
                        <FontAwesomeIcon
                            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400"
                            icon={faLock}
                        />
                        <input
                            autoComplete="current-password"
                            className={inputClass}
                            minLength={6}
                            required
                            type="password"
                            value={currentPassword}
                            onChange={(event) =>
                                setCurrentPassword(event.target.value)
                            }
                        />
                    </span>
                </label>

                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                    Mật khẩu mới
                    <span className="relative grid">
                        <FontAwesomeIcon
                            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400"
                            icon={faKey}
                        />
                        <input
                            autoComplete="new-password"
                            className={inputClass}
                            minLength={6}
                            required
                            type="password"
                            value={newPassword}
                            onChange={(event) =>
                                setNewPassword(event.target.value)
                            }
                        />
                    </span>
                </label>

                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                    Xác nhận mật khẩu mới
                    <span className="relative grid">
                        <FontAwesomeIcon
                            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400"
                            icon={faKey}
                        />
                        <input
                            autoComplete="new-password"
                            className={inputClass}
                            minLength={6}
                            required
                            type="password"
                            value={confirmPassword}
                            onChange={(event) =>
                                setConfirmPassword(event.target.value)
                            }
                        />
                    </span>
                </label>

                <button
                    className="inline-flex min-h-11 items-center justify-center gap-3 rounded-lg bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isSubmitting}
                    type="submit"
                >
                    <FontAwesomeIcon
                        className={isSubmitting ? 'animate-spin' : ''}
                        icon={isSubmitting ? faSpinner : faKey}
                    />
                    {isSubmitting ? 'Đang đổi...' : 'Đổi mật khẩu'}
                </button>

                <button
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    type="button"
                    onClick={onLogout}
                >
                    <FontAwesomeIcon icon={faRightFromBracket} />
                    Đăng xuất
                </button>
            </form>
        </main>
    );
}
