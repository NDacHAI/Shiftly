import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft,
    faBriefcase,
    faEnvelope,
    faGraduationCap,
    faUser,
} from '@fortawesome/free-solid-svg-icons';
import { Link, useParams } from 'react-router-dom';
import { useToast } from '@/components/feedback';
import { EmptyState, LoadingOverlay, PageHeader } from '@/components/ui';
import { roles, type Role } from '@/constants/roles';
import { routes } from '@/constants/routes';
import { useI18n } from '@/i18n';
import { listBranches } from '@/features/branches/api/branches.api';
import { type Branch } from '@/features/branches/types';
import { listPositions } from '@/features/positions/api/positions.api';
import { type Position } from '@/features/positions/types';
import { EmployeeAccountTab } from '../components/detail/EmployeeAccountTab';
import { EmployeeComingSoonTab } from '../components/detail/EmployeeComingSoonTab';
import {
    employeeDetailTabs,
    type EmployeeTab,
} from '../components/detail/employee-detail-tabs';
import { EmployeeProfileTab } from '../components/detail/EmployeeProfileTab';
import {
    getEmployee,
    getEmployeeErrorKey,
    updateEmployee,
} from '../api/employees.api';
import { type Employee, type UpdateEmployeePayload } from '../types';

function fullName(employee: Employee) {
    return `${employee.firstName} ${employee.lastName}`;
}

type EmployeeDetailPageProps = {
    userRole: Role;
};

export function EmployeeDetailPage({ userRole }: EmployeeDetailPageProps) {
    const { id } = useParams<{ id: string }>();
    const { showToast } = useToast();
    const { t } = useI18n();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
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
                        message: t(getEmployeeErrorKey(error)),
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

    useEffect(() => {
        if (userRole !== roles.admin) return;

        let active = true;

        void Promise.all([
            listBranches({
                page: 1,
                limit: 100,
                sortBy: 'name',
                sortOrder: 'ASC',
            }),
            listPositions({
                page: 1,
                limit: 100,
                sortBy: 'name',
                sortOrder: 'ASC',
            }),
        ])
            .then(([BranchResponse, positionResponse]) => {
                if (!active) return;
                setBranches(BranchResponse.data);
                setPositions(positionResponse.data);
            })
            .catch((error) => {
                showToast({
                    message: t(getEmployeeErrorKey(error)),
                    title: t('employees.filtersLoadError'),
                    variant: 'error',
                });
            });

        return () => {
            active = false;
        };
    }, [showToast, t, userRole]);

    async function handleProfileSave(payload: UpdateEmployeePayload) {
        if (!employee) return;

        const updatedEmployee = await updateEmployee(employee.id, payload);
        setEmployee(updatedEmployee);
    }

    return (
        <section className="mx-auto grid max-w-[1440px] gap-5 p-6 max-sm:p-4">
            <PageHeader
                actions={
                    <Link
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                        to={routes.employees}
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                        {t('common.back')}
                    </Link>
                }
                description={employee?.employeeCode}
                icon={<FontAwesomeIcon icon={faEnvelope} />}
                title={employee ? fullName(employee) : t('employees.details')}
            />

            <div className="relative overflow-hidden rounded-xl border border-line bg-white shadow-card">
                <LoadingOverlay label={t('employees.loading')} visible={loading} />
                <div className="flex gap-2 overflow-x-auto border-b border-slate-200 px-4 pt-4">
                    {employeeDetailTabs.map((tab) => {
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
                    <EmployeeProfileTab
                        canManage={userRole === roles.admin}
                        branches={branches}
                        employee={employee}
                        positions={positions}
                        onSave={handleProfileSave}
                    />
                )}
                {employee && activeTab === 'account' && (
                    <EmployeeAccountTab
                        canManage={userRole === roles.admin}
                        employee={employee}
                    />
                )}
                {employee && activeTab === 'education' && (
                    <EmployeeComingSoonTab
                        icon={faGraduationCap}
                        title={t('employees.education')}
                    />
                )}
                {employee && activeTab === 'work' && (
                    <EmployeeComingSoonTab
                        icon={faBriefcase}
                        title={t('employees.work')}
                    />
                )}
            </div>
        </section>
    );
}
