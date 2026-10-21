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
    fieldClass,
    IconButton,
    LoadingOverlay,
    PageHeader,
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
            <PageHeader
                actions={
                    <Button
                        className="max-sm:w-full"
                        onClick={() => void loadPayslips()}
                        size="lg"
                        variant="secondary"
                    >
                        <FontAwesomeIcon icon={faRotateRight} />
                        {t('common.refresh')}
                    </Button>
                }
                description={t('payslips.subtitle')}
                icon={<FontAwesomeIcon icon={faFileInvoiceDollar} />}
                title={
                    isEmployeeView
                    ? t('payslips.myTitle')
                    : t('payslips.title')
                }
            />

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="relative overflow-hidden rounded-xl border border-line bg-white shadow-card">
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
                    <table className="data-table w-full min-w-[980px] table-fixed border-collapse">
                        <thead>
                            <tr>
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
                                <th className="cell-actions">
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
                                        <td className="font-semibold text-slate-900">
                                            {payslip.employeeCode} -{' '}
                                            {payslip.employeeName}
                                        </td>
                                        <td>
                                            {payslip.payrollPeriod.name}
                                        </td>
                                        <td>
                                            {formatMoney(payslip.grossPay)}
                                        </td>
                                        <td className="font-semibold text-slate-900">
                                            {formatMoney(payslip.netPay)}
                                        </td>
                                        <td>
                                            {formatDate(payslip.createdAt)}
                                        </td>
                                        <td className="cell-actions">
                                            <div className="flex items-center justify-end">
                                                <IconButton
                                                    icon={faEye}
                                                    label={t('common.view')}
                                                    onClick={() =>
                                                        void handleView(
                                                            payslip.id,
                                                        )
                                                    }
                                                />
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
