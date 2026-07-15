import { useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEye,
    faFileInvoiceDollar,
    faRotateRight,
    faSearch,
} from '@fortawesome/free-solid-svg-icons';
import {
    Button,
    EmptyState,
    LoadingOverlay,
    Pagination,
} from '@/components/ui';
import { roles, type Role } from '@/constants/roles';
import { useDebounce } from '@/hooks/useDebounce';
import { useI18n } from '@/i18n';
import {
    getPayslip,
    getPayslipErrorKey,
    listMyPayslips,
    listPayslips,
} from '../api/payslips.api';
import { PayslipDetailsDialog } from '../components/PayslipDetailsDialog';
import { type Payslip, type PayslipSortField, type SortOrder } from '../types';

const pageSize = 10;
const fieldClass =
    'min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100';

type PayslipsPageProps = {
    userRole: Role;
};

function formatMoney(value: string) {
    return new Intl.NumberFormat('vi-VN').format(Number(value));
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
    }).format(new Date(value));
}

export function PayslipsPage({ userRole }: PayslipsPageProps) {
    const { t } = useI18n();
    const [payslips, setPayslips] = useState<Payslip[]>([]);
    const [selected, setSelected] = useState<Payslip | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search);
    const [sortBy, setSortBy] = useState<PayslipSortField>('createdAt');
    const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const isEmployeeView = userRole === roles.user;

    const loadPayslips = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const loader = isEmployeeView ? listMyPayslips : listPayslips;
            const response = await loader({
                page,
                limit: pageSize,
                search: debouncedSearch || undefined,
                sortBy,
                sortOrder,
            });
            setPayslips(response.data);
            setTotalPages(response.meta.totalPages);

            if (
                response.meta.totalPages > 0 &&
                page > response.meta.totalPages
            ) {
                setPage(response.meta.totalPages);
            }
        } catch (loadError) {
            setError(t(getPayslipErrorKey(loadError)));
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, isEmployeeView, page, sortBy, sortOrder]);

    useEffect(() => {
        void loadPayslips();
    }, [loadPayslips]);

    async function handleView(id: string) {
        setError('');

        try {
            setSelected(await getPayslip(id));
        } catch (viewError) {
            setError(t(getPayslipErrorKey(viewError)));
        }
    }

    function changeSort(field: PayslipSortField) {
        if (sortBy === field) {
            setSortOrder((current) => (current === 'ASC' ? 'DESC' : 'ASC'));
        } else {
            setSortBy(field);
            setSortOrder('ASC');
        }
        setPage(1);
    }

    function sortLabel(field: PayslipSortField) {
        if (sortBy !== field) return '';
        return sortOrder === 'ASC' ? ' ^' : ' v';
    }

    return (
        <section className="mx-auto grid max-w-[1440px] gap-5 p-6 max-sm:p-4">
            <div className="flex items-center justify-between gap-5 rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm max-lg:items-stretch max-lg:flex-col">
                <div className="flex items-center gap-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xl text-primary-600">
                        <FontAwesomeIcon icon={faFileInvoiceDollar} />
                    </span>
                    <div>
                        <h2 className="text-xl font-bold text-slate-950">
                            {isEmployeeView
                                ? t('payslips.myTitle')
                                : t('payslips.title')}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {t('payslips.subtitle')}
                        </p>
                    </div>
                </div>
                <Button
                    className="max-sm:w-full"
                    onClick={() => void loadPayslips()}
                    size="lg"
                    variant="secondary"
                >
                    <FontAwesomeIcon icon={faRotateRight} />
                    {t('common.refresh')}
                </Button>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <LoadingOverlay
                    label={t('payslips.loading')}
                    visible={loading}
                />
                <div className="flex items-center justify-between gap-4 border-b border-slate-200 p-4 max-lg:items-stretch max-lg:flex-col">
                    <label className="relative block w-full max-w-sm">
                        <span className="sr-only">{t('common.search')}</span>
                        <FontAwesomeIcon
                            className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400"
                            icon={faSearch}
                        />
                        <input
                            aria-label={t('common.search')}
                            className={`${fieldClass} pl-9`}
                            placeholder={t('payslips.searchPlaceholder')}
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                        />
                    </label>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] table-fixed border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                {(
                                    [
                                        ['employeeCode', t('payslips.employee')],
                                        ['employeeName', t('payslips.period')],
                                        ['grossPay', t('payslips.grossPay')],
                                        ['netPay', t('payslips.netPay')],
                                        ['createdAt', t('common.createdAt')],
                                    ] as const
                                ).map(([field, label]) => (
                                    <th
                                        className="px-5 py-3 text-center text-xs font-semibold text-slate-600"
                                        key={field}
                                    >
                                        <button
                                            className="min-h-0 cursor-pointer bg-transparent p-0 text-inherit hover:text-primary-600"
                                            onClick={() => changeSort(field)}
                                            type="button"
                                        >
                                            {label}
                                            {sortLabel(field)}
                                        </button>
                                    </th>
                                ))}
                                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-600">
                                    {t('common.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading &&
                                payslips.map((payslip) => (
                                    <tr
                                        className="border-b border-slate-100 transition hover:bg-slate-50/80 last:border-0"
                                        key={payslip.id}
                                    >
                                        <td className="px-5 py-3.5 text-center text-sm font-semibold text-slate-800">
                                            {payslip.employeeCode} -{' '}
                                            {payslip.employeeName}
                                        </td>
                                        <td className="px-5 py-3.5 text-center text-sm text-slate-700">
                                            {payslip.payrollPeriod.name}
                                        </td>
                                        <td className="px-5 py-3.5 text-center text-sm text-slate-700">
                                            {formatMoney(payslip.grossPay)}
                                        </td>
                                        <td className="px-5 py-3.5 text-center text-sm font-semibold text-slate-800">
                                            {formatMoney(payslip.netPay)}
                                        </td>
                                        <td className="px-5 py-3.5 text-center text-sm text-slate-700">
                                            {formatDate(payslip.createdAt)}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center justify-center">
                                                <button
                                                    aria-label={t('common.view')}
                                                    className="flex size-9 min-h-0 cursor-pointer items-center justify-center rounded-lg border border-primary-100 bg-primary-50 p-0 text-primary-600 transition hover:border-primary-300 hover:bg-primary-600 hover:text-white"
                                                    title={t('common.view')}
                                                    type="button"
                                                    onClick={() =>
                                                        void handleView(
                                                            payslip.id,
                                                        )
                                                    }
                                                >
                                                    <FontAwesomeIcon icon={faEye} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            {!loading && payslips.length === 0 && (
                                <tr>
                                    <td colSpan={6}>
                                        <EmptyState
                                            description={t(
                                                'payslips.noResultsDescription',
                                            )}
                                            icon={
                                                <FontAwesomeIcon
                                                    icon={faFileInvoiceDollar}
                                                />
                                            }
                                            title={t('payslips.noResultsTitle')}
                                        />
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    page={page}
                    pageSize={pageSize}
                    totalPages={totalPages}
                    onPageChange={setPage}
                />
            </div>

            {selected && (
                <PayslipDetailsDialog
                    payslip={selected}
                    onClose={() => setSelected(null)}
                />
            )}
        </section>
    );
}
