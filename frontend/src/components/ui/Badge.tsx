import { type ReactNode } from 'react';
import {
    badgeClass,
    badgeToneClasses,
    type BadgeTone,
} from './badge-classes';


type BadgeProps = {
    children: ReactNode;
    className?: string;
    dot?: boolean;
    tone?: BadgeTone;
};

export function Badge({
    children,
    className = '',
    dot = false,
    tone = 'neutral',
}: BadgeProps) {
    return (
        <span className={`${badgeClass} ${badgeToneClasses[tone]} ${className}`}>
            {dot && <span className="size-1.5 rounded-full bg-current" />}
            {children}
        </span>
    );
}
