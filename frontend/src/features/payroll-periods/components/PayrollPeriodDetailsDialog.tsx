import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@/components/ui';
import { useI18n } from '@/i18n';
import { type PayrollPeriod, PayrollPeriodStatus } from '../types';

type PayrollPeriodDetailsDialogProps = {
    period: PayrollPeriod;
    onClose: () => void;
};

function formatDate(value: string) {
    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
    }).format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value: string | null) {
    if (!value) return '-';

    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(value));
}

function statusKey(status: PayrollPeriodStatus) {
    if (status === PayrollPeriodStatus.Draft) return 'payrollPeriods.draft';
    if (status === PayrollPeriodStatus.Open) return 'payrollPeriods.open';
    return 'payrollPeriods.closed';
}

export function PayrollPeriodDetailsDialog({
    period,
    onClose,
}: PayrollPeriodDetailsDialogProps) {
    const { t } = useI18n();
    const details = [
        [t('payrollPeriods.code'), period.code],
        [t('payrollPeriods.name'), period.name],
        [t('payrollPeriods.month'), period.payrollMonth.toString()],
        [t('payrollPeriods.year'), period.payrollYear.toString()],
        [t('payrollPeriods.startDate'), formatDate(period.startDate)],
        [t('payrollPeriods.endDate'), formatDate(period.endDate)],
        [t('common.status'), t(statusKey(period.status))],
        [t('payrollPeriods.openedAt'), formatDateTime(period.openedAt)],
        [t('payrollPeriods.closedAt'), formatDateTime(period.closedAt)],
        [t('common.createdAt'), formatDateTime(period.createdAt)],
        [t('common.updatedAt'), formatDateTime(period.updatedAt)],
    ];

    return (
        <div className="dialog-backdrop fixed inset-0 z-30 flex items-center justify-center bg-slate-950/55 p-5">
            <div
                aria-modal="true"
                className="dialog-panel max-h-[calc(100vh-40px)] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl"
                role="dialog"
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold tracking-wider text-violet-600 uppercase">
                            {period.code}
                        </p>
                        <h2 className="mt-1 text-xl font-bold text-slate-950">
                            {period.name}
                        </h2>
                    </div>
                    <Button
                        aria-label={t('common.close')}
                        onClick={onClose}
                        size="icon"
                        variant="ghost"
                    >
                        <FontAwesomeIcon icon={faXmark} />
                    </Button>
                </div>
                <dl className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
                    {details.map(([label, value]) => (
                        <div className="grid gap-1 py-4" key={label}>
                            <dt className="text-xs font-semibold text-slate-500">
                                {label}
                            </dt>
                            <dd className="m-0 text-sm text-slate-800">
                                {value}
                            </dd>
                        </div>
                    ))}
                </dl>
            </div>
        </div>
    );
}
