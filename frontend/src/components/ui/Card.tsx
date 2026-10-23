import { type HTMLAttributes } from 'react';

export const cardClass =
    'rounded-[14px] border border-rule bg-paper';

export function Card({
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return <div className={`${cardClass} ${className}`} {...props} />;
}
