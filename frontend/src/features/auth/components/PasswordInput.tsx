import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { useI18n } from '@/i18n';

type PasswordInputProps = {
    autoComplete: string;
    id?: string;
    invalid?: boolean;
    placeholder?: string;
    // Shows a green check instead of the eye toggle (confirmation field).
    valid?: boolean;
    value: string;
    onChange: (value: string) => void;
};

// Password field with an eye / eye-slash toggle, shared by sign-in and change-password.
export function PasswordInput({
    autoComplete,
    id,
    invalid = false,
    placeholder,
    valid = false,
    value,
    onChange,
}: PasswordInputProps) {
    const { t } = useI18n();
    const [visible, setVisible] = useState(false);

    return (
        <div className="relative">
            <input
                aria-invalid={invalid}
                autoComplete={autoComplete}
                className={`h-[46px] w-full rounded-[10px] border bg-white pr-12 pl-3.5 text-[15px] font-normal text-ink outline-none transition-colors placeholder:text-faint focus:border-ink ${
                    invalid ? 'border-ember-strong' : valid ? 'border-live' : 'border-rule-strong'
                }`}
                id={id}
                placeholder={placeholder}
                type={visible ? 'text' : 'password'}
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
            {valid ? (
                <span className="absolute top-[13px] right-3.5 grid size-5 place-items-center rounded-full bg-live text-[10px] text-white">
                    <FontAwesomeIcon icon={faCheck} />
                </span>
            ) : (
                <button
                    aria-label={visible ? t('login.hidePasswordAria') : t('login.showPasswordAria')}
                    aria-pressed={visible}
                    className="absolute top-[7px] right-1.5 grid size-8 min-h-0 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-sm text-muted transition-colors hover:bg-stone hover:text-ink"
                    title={visible ? t('login.hidePasswordAria') : t('login.showPasswordAria')}
                    type="button"
                    onClick={() => setVisible((current) => !current)}
                >
                    <FontAwesomeIcon icon={visible ? faEyeSlash : faEye} />
                </button>
            )}
        </div>
    );
}
