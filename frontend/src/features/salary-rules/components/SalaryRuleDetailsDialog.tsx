import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@/components/ui';
import { useI18n } from '@/i18n';
import { type SalaryRule, SalaryRuleStatus } from '../types';

type SalaryRuleDetailsDialogProps = {
    salaryRule: SalaryRule;
    onClose: () => void;
};

function formatDateTime(value: string) {
    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(value));
}

export function SalaryRuleDetailsDialog({
    salaryRule,
    onClose,
}: SalaryRuleDetailsDialogProps) {
    const { t } = useI18n();
    const details = [
        [t('salaryRules.code'), salaryRule.code],
        [
            t('common.status'),
            salaryRule.status === SalaryRuleStatus.Active
                ? t('common.active')
                : t('common.inactive'),
        ],
        [
            t('salaryRules.currentMultiplier'),
            salaryRule.currentMultiplier ?? t('salaryRules.noCurrentVersion'),
        ],
        [t('salaryRules.note'), salaryRule.note || '-'],
        [t('common.createdAt'), formatDateTime(salaryRule.createdAt)],
        [t('common.updatedAt'), formatDateTime(salaryRule.updatedAt)],
    ];

    return (
        <div className="dialog-backdrop fixed inset-0 z-30 flex items-center justify-center bg-slate-950/55 p-5">
            <div
                aria-modal="true"
                className="dialog-panel flex max-h-[calc(100vh-40px)] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
                role="dialog"
            >
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
                    <div>
                        <p className="text-xs font-bold tracking-wider text-violet-600 uppercase">
                            {salaryRule.code}
                        </p>
                        <h2 className="mt-1 text-xl font-bold text-slate-950">
                            {salaryRule.name}
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

                <div className="overflow-y-auto px-6 py-5">
                    <dl className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
                        {details.map(([label, value]) => (
                            <div
                                className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                                key={label}
                            >
                                <dt className="text-xs font-semibold text-slate-500">
                                    {label}
                                </dt>
                                <dd className="mt-1 text-sm font-semibold text-slate-800">
                                    {value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </div>
        </div>
    );
}
