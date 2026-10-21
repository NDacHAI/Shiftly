import { type IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { type ReactNode } from 'react';

type StatCardTone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

type StatCardProps = {
    icon: IconDefinition;
    label: string;
    value: ReactNode;
    hint?: ReactNode;
    tone?: StatCardTone;
};

const toneClasses: Record<StatCardTone, string> = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    danger: 'bg-red-50 text-red-600',
    neutral: 'bg-slate-100 text-slate-600',
};

export function StatCard({
    icon,
    label,
    value,
    hint,
    tone = 'primary',
}: StatCardProps) {
    return (
        <div className="flex items-start gap-4 rounded-xl border border-line bg-white p-5 shadow-card">
            <span
                className={`flex size-11 shrink-0 items-center justify-center rounded-full text-lg ${toneClasses[tone]}`}
            >
                <FontAwesomeIcon icon={icon} />
            </span>
            <div className="min-w-0">
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
                {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
            </div>
        </div>
    );
}
