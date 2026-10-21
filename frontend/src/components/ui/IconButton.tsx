import { type ButtonHTMLAttributes } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { type IconDefinition } from '@fortawesome/free-solid-svg-icons';
import {
    iconButtonClass,
    iconButtonToneClasses,
    type IconButtonTone,
} from './icon-button-classes';


type IconButtonProps = Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'aria-label' | 'children'
> & {
    icon: IconDefinition;
    label: string;
    tone?: IconButtonTone;
};

export function IconButton({
    className = '',
    icon,
    label,
    tone = 'neutral',
    type = 'button',
    ...props
}: IconButtonProps) {
    return (
        <button
            aria-label={label}
            className={`${iconButtonClass} ${iconButtonToneClasses[tone]} ${className}`}
            title={label}
            type={type}
            {...props}
        >
            <FontAwesomeIcon icon={icon} />
        </button>
    );
}
