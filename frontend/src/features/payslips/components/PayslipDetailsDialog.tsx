import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@/components/ui';
import { useI18n } from '@/i18n';
import { type Payslip } from '../types';

type PayslipDetailsDialogProps = {
    payslip: Payslip;
    onClose: () => void;
};

function formatMoney(value: string) {
    return new Intl.NumberFormat('vi-VN').format(Number(value));
}

function formatMinutes(value: number) {
    const hours = Math.floor(value / 60);
    const minutes = value % 60;

    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
}

export function PayslipDetailsDialog({
    payslip,
    onClose,
}: PayslipDetailsDialogProps) {
    const { t } = useI18n();

    return (
        <div className="dialog-backdrop fixed inset-0 z-30 flex items-center justify-center bg-slate-950/55 p-5">
            <div
                aria-modal="true"
                className="dialog-panel max-h-[calc(100vh-40px)] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl"
                role="dialog"
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-950">
                            {t('payslips.detailsTitle')}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {payslip.employeeCode} - {payslip.employeeName}
                        </p>
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

                <div className="mt-6 grid gap-5">
                    <div className="grid gap-3 text-sm">
                        <PayslipLine
                            label={t('payslips.period')}
                            value={payslip.payrollPeriod.name}
                        />
                        <PayslipLine
                            label={t('payslips.branch')}
                            value={payslip.branchName}
                        />
                        <PayslipLine
                            label={t('payslips.position')}
                            value={payslip.positionName}
                        />
                        <PayslipLine
                            label={t('payslips.hourlyRate')}
                            value={formatMoney(payslip.hourlyRate)}
                        />
                    </div>

                    <div className="grid gap-2 border-t border-slate-100 pt-4 text-sm">
                        <PayslipLine
                            label={`${t('payslips.regularPay')} (${formatMinutes(
                                payslip.workedMinutes,
                            )})`}
                            value={formatMoney(payslip.regularPay)}
                        />
                        <PayslipLine
                            label={`${t('payslips.overtimePay')} (${formatMinutes(
                                payslip.overtimeMinutes,
                            )})`}
                            value={formatMoney(payslip.overtimePay)}
                        />
                        <PayslipLine
                            label={`${t('payslips.holidayPay')} (${formatMinutes(
                                payslip.holidayMinutes,
                            )})`}
                            value={formatMoney(payslip.holidayPay)}
                        />
                        <PayslipLine
                            label={`${t('payslips.holidayOvertimePay')} (${formatMinutes(
                                payslip.holidayOvertimeMinutes,
                            )})`}
                            value={formatMoney(payslip.holidayOvertimePay)}
                        />
                        <PayslipLine
                            label={t('payslips.rewardTotal')}
                            value={`+${formatMoney(payslip.rewardTotal)}`}
                        />
                        <PayslipLine
                            label={t('payslips.penaltyTotal')}
                            value={`-${formatMoney(payslip.penaltyTotal)}`}
                        />
                    </div>

                    <div className="grid gap-2 rounded-lg bg-slate-50 p-4 text-sm">
                        <PayslipLine
                            label={t('payslips.grossPay')}
                            value={formatMoney(payslip.grossPay)}
                        />
                        <PayslipLine
                            label={t('payslips.netPay')}
                            strong
                            value={formatMoney(payslip.netPay)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

type PayslipLineProps = {
    label: string;
    value: string;
    strong?: boolean;
};

function PayslipLine({ label, value, strong = false }: PayslipLineProps) {
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500">{label}</span>
            <span
                className={`text-right ${
                    strong
                        ? 'text-base font-bold text-primary-700'
                        : 'font-semibold text-slate-800'
                }`}
            >
                {value}
            </span>
        </div>
    );
}
