import {
    type ReactNode,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faChevronDown } from '@fortawesome/free-solid-svg-icons';

export type DropdownSelectOption<TValue extends string> = {
    value: TValue;
    label: string;
    icon?: ReactNode;
};

type DropdownSelectProps<TValue extends string> = {
    ariaLabel?: string;
    className?: string;
    disabled?: boolean;
    options: Array<DropdownSelectOption<TValue>>;
    placeholder?: string;
    size?: 'xs' | 'md' | 'lg';
    triggerIcon?: ReactNode;
    value: TValue;
    onChange: (value: TValue) => void;
};

export function DropdownSelect<TValue extends string>({
    ariaLabel,
    className = '',
    disabled = false,
    options,
    placeholder,
    size = 'md',
    triggerIcon,
    value,
    onChange,
}: DropdownSelectProps<TValue>) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const listboxId = useId();
    const selectedOption = useMemo(
        () => options.find((option) => option.value === value),
        [options, value],
    );

    useEffect(() => {
        function closeOnOutsideClick(event: MouseEvent) {
            if (
                rootRef.current &&
                !rootRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        }

        function closeOnEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        }

        document.addEventListener('mousedown', closeOnOutsideClick);
        document.addEventListener('keydown', closeOnEscape);

        return () => {
            document.removeEventListener('mousedown', closeOnOutsideClick);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, []);

    return (
        <div
            className={`dropdown-select dropdown-select--${size} ${className}`}
            ref={rootRef}
        >
            <button
                aria-expanded={open}
                aria-haspopup="listbox"
                aria-label={ariaLabel}
                className="dropdown-select__trigger"
                disabled={disabled}
                onClick={() => setOpen((current) => !current)}
                type="button"
            >
                <span className="dropdown-select__value">
                    {triggerIcon && (
                        <span className="dropdown-select__trigger-icon">
                            {triggerIcon}
                        </span>
                    )}
                    <span className="dropdown-select__label">
                        {selectedOption?.label ?? placeholder}
                    </span>
                </span>
                <FontAwesomeIcon
                    className={`dropdown-select__chevron ${
                        open ? 'dropdown-select__chevron--open' : ''
                    }`}
                    icon={faChevronDown}
                />
            </button>

            {open && (
                <div className="dropdown-select__panel">
                    <ul
                        aria-label={ariaLabel}
                        className="dropdown-select__list"
                        id={listboxId}
                        role="listbox"
                    >
                        {options.map((option) => {
                            const selected = option.value === value;

                            return (
                                <li key={option.value} role="presentation">
                                    <button
                                        aria-selected={selected}
                                        className={`dropdown-select__option ${
                                            selected
                                                ? 'dropdown-select__option--selected'
                                                : ''
                                        }`}
                                        onClick={() => {
                                            onChange(option.value);
                                            setOpen(false);
                                        }}
                                        role="option"
                                        type="button"
                                    >
                                        {option.icon && (
                                            <span className="dropdown-select__option-icon">
                                                {option.icon}
                                            </span>
                                        )}
                                        <span className="dropdown-select__option-label">
                                            {option.label}
                                        </span>
                                        {selected && (
                                            <FontAwesomeIcon
                                                className="dropdown-select__check"
                                                icon={faCheck}
                                            />
                                        )}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}
