import { useI18n } from '@/i18n';
import { statusStyles } from '../lib/employee-ui';
import { type EmployeeStatus } from '../types';

export function EmployeeStatusPill({ status }: { status: EmployeeStatus }) {
    const { t } = useI18n();
    const style = statusStyles[status];

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-[9px] py-[3px] text-xs font-semibold whitespace-nowrap ${style.pill}`}
        >
            <span className={`size-1.5 rounded-full ${style.dot}`} />
            {t(style.labelKey)}
        </span>
    );
}
