import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft,
    faBriefcase,
    faEnvelope,
    faGraduationCap,
    faIdCard,
    faUser,
    type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { Link, useParams } from 'react-router-dom';
import { useToast } from '@/components/feedback';
import { EmptyState, LoadingOverlay } from '@/components/ui';
import { routes } from '@/constants/routes';
import { type I18nKey, useI18n } from '@/i18n';
import { getEmployee, getEmployeeErrorMessage } from '../api/employees.api';
import { type Employee } from '../types';

type EmployeeTab = 'profile' | 'account' | 'education' | 'work';

const tabs: Array<{
    id: EmployeeTab;
    labelKey: I18nKey;
    icon: IconDefinition;
}> = [
    { id: 'profile', labelKey: 'employees.profile', icon: faUser },
    { id: 'account', labelKey: 'employees.account', icon: faIdCard },
    { id: 'education', labelKey: 'employees.education', icon: faGraduationCap },
    { id: 'work', labelKey: 'employees.work', icon: faBriefcase },
];

function fullName(employee: Employee) {
    return `${employee.firstName} ${employee.lastName}`;
}

function formatDate(value: string | null) {
    if (!value) return '-';
    return new Intl.DateTimeFormat('vi-VN').format(new Date(value));
}

function formatDateTime(value: string) {
    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(value));
}

function joinNames(items: Array<{ name: string }>) {
    return items.map((item) => item.name).join(', ') || '-';
}

function ProfileTab({ employee }: { employee: Employee }) {
    const { t } = useI18n();
    const details = [
        [t('employees.employeeCode'), employee.employeeCode],
        [t('employees.firstName'), employee.firstName],
        [t('employees.lastName'), employee.lastName],
        [t('common.fullName'), fullName(employee)],
        [t('common.email'), employee.email],
        [t('employees.phoneNumber'), employee.phoneNumber || '-'],
        [t('employees.dateOfBirth'), formatDate(employee.dateOfBirth)],
        [t('employees.gender'), employee.gender || '-'],
        [t('employees.address'), employee.address || '-'],
        [t('common.departments'), joinNames(employee.departments)],
        [t('common.positions'), joinNames(employee.positions)],
        [t('employees.hireDate'), formatDate(employee.hireDate)],
        [
            t('common.status'),
            employee.status === 'Active'
                ? t('common.active')
                : t('common.inactive'),
        ],
        [t('common.updatedAt'), formatDateTime(employee.updatedAt)],
    ];

    return (
        <dl className="grid grid-cols-2 gap-x-8 gap-y-1 p-6 max-lg:grid-cols-1">
            {details.map(([label, value]) => (
                <div
                    className="grid grid-cols-[160px_1fr] gap-4 border-b border-slate-100 py-4 max-sm:grid-cols-1 max-sm:gap-1"
                    key={label}
                >
                    <dt className="text-xs font-semibold text-slate-500">
                        {label}
                    </dt>
                    <dd className="text-sm font-medium text-slate-800">
                        {value}
                    </dd>
                </div>
            ))}
        </dl>
    );
}

function ComingSoonTab({
    icon,
    title,
}: {
    icon: IconDefinition;
    title: string;
}) {
    const { t } = useI18n();

    return (
        <EmptyState
            description={t('employees.tabComingSoon')}
            icon={<FontAwesomeIcon icon={icon} />}
            title={title}
        />
    );
}

export function EmployeeDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { showToast } = useToast();
    const { t } = useI18n();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<EmployeeTab>('profile');

    useEffect(() => {
        if (!id) return;

        let active = true;

        async function loadEmployee() {
            try {
                const employeeResponse = await getEmployee(id as string);

                if (active) {
                    setEmployee(employeeResponse);
                }
            } catch (error) {
                if (active) {
                    showToast({
                        message: getEmployeeErrorMessage(error),
                        title: t('employees.loadDetailError'),
                        variant: 'error',
                    });
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        void loadEmployee();

        return () => {
            active = false;
        };
    }, [id, showToast, t]);

    return (
        <section className="mx-auto grid max-w-[1440px] gap-5 p-6 max-sm:p-4">
            <div className="flex items-center justify-between gap-5 rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm max-sm:flex-col max-sm:items-stretch">
                <div className="flex items-center gap-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                        <FontAwesomeIcon icon={faEnvelope} />
                    </span>
                    <div>
                        <p className="text-xs font-bold tracking-wider text-primary-600 uppercase">
                            {employee?.employeeCode ?? 'Employee'}
                        </p>
                        <h2 className="mt-1 text-xl font-bold text-slate-950">
                            {employee ? fullName(employee) : t('employees.details')}
                        </h2>
                    </div>
                </div>
                <Link
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
                    to={routes.employees}
                >
                    <FontAwesomeIcon icon={faArrowLeft} />
                    {t('common.back')}
                </Link>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <LoadingOverlay label={t('employees.loading')} visible={loading} />
                <div className="flex gap-2 overflow-x-auto border-b border-slate-200 px-4 pt-4">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;

                        return (
                            <button
                                className={`flex min-h-11 items-center gap-2 border-b-2 px-3 text-sm font-semibold whitespace-nowrap transition ${
                                    isActive
                                        ? 'border-primary-600 text-primary-700'
                                        : 'border-transparent text-slate-500 hover:text-slate-800'
                                }`}
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                type="button"
                            >
                                <FontAwesomeIcon icon={tab.icon} />
                                {t(tab.labelKey)}
                            </button>
                        );
                    })}
                </div>

                {!loading && !employee && (
                    <EmptyState
                        description={t('employees.notFoundDescription')}
                        icon={<FontAwesomeIcon icon={faUser} />}
                        title={t('employees.notFoundTitle')}
                    />
                )}

                {employee && activeTab === 'profile' && (
                    <ProfileTab employee={employee} />
                )}
                {employee && activeTab === 'account' && (
                    <ComingSoonTab icon={faIdCard} title={t('employees.account')} />
                )}
                {employee && activeTab === 'education' && (
                    <ComingSoonTab
                        icon={faGraduationCap}
                        title={t('employees.education')}
                    />
                )}
                {employee && activeTab === 'work' && (
                    <ComingSoonTab icon={faBriefcase} title={t('employees.work')} />
                )}
            </div>
        </section>
    );
}
