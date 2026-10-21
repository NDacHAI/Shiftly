import { type HTMLAttributes } from 'react';

export const cardClass =
    'rounded-xl border border-line bg-white shadow-card';

export function Card({
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return <div className={`${cardClass} ${className}`} {...props} />;
}
