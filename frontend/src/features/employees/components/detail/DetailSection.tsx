import { type ReactNode } from 'react';

type DetailSectionProps = {
    title: string;
    hint: string;
    children: ReactNode;
    divided?: boolean;
};

// Two-column row: a short title and hint on the left, the fields on the right.
export function DetailSection({
    title,
    hint,
    children,
    divided = false,
}: DetailSectionProps) {
    return (
        <div
            className={`flex flex-wrap gap-x-12 gap-y-6 p-7 max-sm:p-4 ${
                divided ? 'border-b border-rule-soft' : ''
            }`}
        >
            <div className="flex flex-[0_0_220px] flex-col gap-1 max-sm:flex-auto">
                <h3 className="text-[15px] font-semibold">{title}</h3>
                <span className="text-[13px] text-pretty text-muted">{hint}</span>
            </div>
            <div className="flex min-w-0 flex-[1_1_480px] flex-col gap-4">
                {children}
            </div>
        </div>
    );
}
