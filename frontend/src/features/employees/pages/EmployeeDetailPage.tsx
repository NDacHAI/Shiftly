import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { ConfirmDialog, useToast } from '@/components/feedback';
import { useSlidingIndicator } from '@/components/layout/useSlidingIndicator';
import { roles, type Role } from '@/constants/roles';
import { routes } from '@/constants/routes';
import { useI18n } from '@/i18n';
import { listBranches } from '@/features/branches/api/branches.api';
import { type Branch } from '@/features/branches/types';
import { initialsOf, interpolate } from '@/features/dashboard/lib/format';
import { listPositions } from '@/features/positions/api/positions.api';
import { type Position } from '@/features/positions/types';
import {
    getEmployee,
    getEmployeeAccount,
    getEmployeeErrorKey,
    getEmployeeErrorMessage,
    updateEmployee,
    updateEmployeeAccount,
} from '../api/employees.api';
import { EmployeeStatusPill } from '../components/EmployeeStatusPill';
import { EmployeeAccountTab } from '../components/detail/EmployeeAccountTab';
import { EmployeeEducationTab } from '../components/detail/EmployeeEducationTab';
import { EmployeeInfoTab } from '../components/detail/EmployeeInfoTab';
import { EmployeeWorkTab } from '../components/detail/EmployeeWorkTab';
import { UnsavedChangesBar } from '../components/detail/UnsavedChangesBar';
import {
    employeeDetailTabs,
    type EmployeeDetailFormValues,
    type EmployeeTab,
} from '../components/detail/employee-detail-tabs';
import { employeeFullName } from '../lib/employee-ui';
import { type Employee, type EmployeeAccount } from '../types';

type EmployeeDetailPageProps = {
    userRole: Role;
};

function toFormValues(employee: Employee): EmployeeDetailFormValues {
    return {
        firstName: employee.firstName,
        lastName: employee.lastName,
        gender: employee.gender ?? '',
        dateOfBirth: employee.dateOfBirth ?? '',
        status: employee.status,
        email: employee.email,
        phoneNumber: employee.phoneNumber ?? '',
        address: employee.address ?? '',
        branchIds: employee.branches.map((branch) => branch.id),
        positionId: employee.positions[0]?.id ?? '',
        hireDate: employee.hireDate ?? '',
    };
}

const emptyFormValues: EmployeeDetailFormValues = {
    firstName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
    status: 'Active',
    email: '',
    phoneNumber: '',
    address: '',
    branchIds: [],
    positionId: '',
    hireDate: '',
};

export function EmployeeDetailPage({ userRole }: EmployeeDetailPageProps) {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { language, t } = useI18n();
    const canManage = userRole === roles.admin;
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<EmployeeTab>('info');
    const [account, setAccount] = useState<EmployeeAccount | null>(null);
    const [accountLoading, setAccountLoading] = useState(canManage);
    const [accountRole, setAccountRole] = useState<Role>(roles.user);
    const [saving, setSaving] = useState(false);
    const [confirmLeave, setConfirmLeave] = useState(false);
    const { containerRef: tabsRef, indicatorRef: tabLineRef } =
        useSlidingIndicator<HTMLDivElement>('employee-detail-tab', `${activeTab}|${language}`);
    const {
        control,
        formState: { errors, isDirty },
        handleSubmit,
        register,
        reset,
        setError,
        setValue,
    } = useForm<EmployeeDetailFormValues>({
        values: employee ? toFormValues(employee) : emptyFormValues,
    });
    const branchIds = useWatch({ control, name: 'branchIds' });
    const hireDate = useWatch({ control, name: 'hireDate' });

    useEffect(() => {
        if (!id) return;

        let active = true;

        getEmployee(id)
            .then((employeeResponse) => {
                if (active) setEmployee(employeeResponse);
            })
            .catch((error) => {
                if (!active) return;
                showToast({
                    message: t(getEmployeeErrorKey(error)),
                    title: t('employees.loadDetailError'),
                    variant: 'error',
                });
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [id, showToast, t]);

    useEffect(() => {
        if (!canManage || !id) return;

        let active = true;

        getEmployeeAccount(id)
            .then((accountResponse) => {
                if (!active) return;
                setAccount(accountResponse);
                setAccountRole(accountResponse?.role ?? roles.user);
            })
            .catch((error) => {
                if (!active) return;
                showToast({
                    message: t(getEmployeeErrorKey(error)),
                    title: t('employees.accountLoadError'),
                    variant: 'error',
                });
            })
            .finally(() => {
                if (active) setAccountLoading(false);
            });

        return () => {
            active = false;
        };
    }, [canManage, id, showToast, t]);

    useEffect(() => {
        if (!canManage) return;

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
    }, [canManage, showToast, t]);

    // Read-only viewers only see the employee's own branches and positions.
    const branchOptions = canManage ? branches : (employee?.branches ?? []);
    const positionOptions = canManage ? positions : (employee?.positions ?? []);
    const roleDirty = Boolean(account) && account?.role !== accountRole;
    const dirty = canManage && (isDirty || roleDirty);
    const name = employee ? employeeFullName(employee) : '';

    function toggleBranch(branchId: string) {
        setValue(
            'branchIds',
            branchIds.includes(branchId)
                ? branchIds.filter((item) => item !== branchId)
                : [...branchIds, branchId],
            { shouldDirty: true },
        );
    }

    function discardChanges() {
        reset();
        setAccountRole(account?.role ?? roles.user);
    }

    async function saveChanges(values: EmployeeDetailFormValues) {
        if (!employee) return;
        setSaving(true);

        try {
            if (isDirty) {
                const updatedEmployee = await updateEmployee(employee.id, {
                    firstName: values.firstName.trim(),
                    lastName: values.lastName.trim(),
                    email: values.email.trim(),
                    phoneNumber: values.phoneNumber.trim() || undefined,
                    dateOfBirth: values.dateOfBirth || undefined,
                    gender: values.gender || undefined,
                    branchIds: values.branchIds,
                    positionIds: values.positionId ? [values.positionId] : [],
                    hireDate: values.hireDate || undefined,
                    address: values.address.trim() || undefined,
                    status: values.status,
                });
                setEmployee(updatedEmployee);
            }

            if (account && roleDirty) {
                const updatedAccount = await updateEmployeeAccount(employee.id, {
                    role: accountRole,
                });
                setAccount(updatedAccount);
                setAccountRole(updatedAccount.role);
            }

            showToast({
                message: interpolate(t('employees.profileSaved'), {
                    name: employeeFullName(values),
                }),
                variant: 'success',
            });
        } catch (error) {
            const message = t(getEmployeeErrorKey(error));

            if (getEmployeeErrorMessage(error).toLowerCase().includes('email')) {
                setError('email', { message, type: 'server' });
                setActiveTab('info');
                return;
            }

            showToast({
                message,
                title: t('employees.saveError'),
                variant: 'error',
            });
        } finally {
            setSaving(false);
        }
    }

    function goBack() {
        if (dirty) {
            setConfirmLeave(true);
            return;
        }

        navigate(routes.employees);
    }

    const missingCount = employee
        ? [!employee.dateOfBirth, !employee.phoneNumber, !employee.gender].filter(Boolean).length
        : 0;

    function tabBadge(tab: EmployeeTab) {
        if (tab === 'info' && missingCount > 0) {
            return interpolate(t('employees.missingCount'), { count: missingCount });
        }

        if (tab === 'account' && canManage && !accountLoading && !account) {
            return t('employees.noAccountShort');
        }

        return null;
    }

    function renderTab() {
        if (!employee) return null;

        switch (activeTab) {
            case 'info':
                return (
                    <EmployeeInfoTab
                        disabled={!canManage}
                        employeeCode={employee.employeeCode}
                        errors={errors}
                        register={register}
                    />
                );
            case 'account':
                return (
                    <EmployeeAccountTab
                        account={account}
                        canManage={canManage}
                        employee={employee}
                        loading={accountLoading}
                        role={accountRole}
                        onAccountChange={(nextAccount) => {
                            setAccount(nextAccount);
                            setAccountRole(nextAccount.role);
                        }}
                        onRoleChange={setAccountRole}
                    />
                );
            case 'education':
                return <EmployeeEducationTab />;
            case 'work':
                return (
                    <EmployeeWorkTab
                        branchIds={branchIds}
                        branches={branchOptions}
                        disabled={!canManage}
                        hireDate={hireDate}
                        positions={positionOptions}
                        register={register}
                        onToggleBranch={toggleBranch}
                    />
                );
        }
    }

    return (
        <section className="bg-sand text-ink">
            <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5 px-8 pt-8 pb-28 max-sm:px-4">
                <button
                    className="flex min-h-0 cursor-pointer items-center gap-1.5 self-start border-0 bg-transparent p-0 text-[13px] text-muted transition-colors hover:text-ink"
                    type="button"
                    onClick={goBack}
                >
                    <FontAwesomeIcon className="text-xs" icon={faArrowLeft} />
                    {t('employees.backToList')}
                </button>

                {loading ? (
                    <div className="flex items-center gap-[18px]">
                        <span className="size-16 animate-pulse rounded-full bg-stone" />
                        <span className="flex flex-col gap-2.5">
                            <span className="h-7 w-56 animate-pulse rounded bg-stone" />
                            <span className="h-3 w-40 animate-pulse rounded bg-stone" />
                        </span>
                    </div>
                ) : employee ? (
                    <div className="rise-enter flex min-w-0 items-center gap-[18px]">
                        <span className="grid size-16 flex-none place-items-center rounded-full bg-ink text-xl font-semibold tracking-[-0.02em] text-sand">
                            {initialsOf(name)}
                        </span>
                        <div className="flex min-w-0 flex-col gap-1.5">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-[30px] leading-tight font-semibold tracking-[-0.03em] max-sm:text-2xl">
                                    {name}
                                </h1>
                                <EmployeeStatusPill status={employee.status} />
                            </div>
                            <span className="tabular-nums text-xs tracking-[0.02em] text-muted">
                                {[
                                    employee.employeeCode,
                                    employee.positions.map((position) => position.name).join(', '),
                                    employee.branches.map((branch) => branch.name).join(', '),
                                ]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-1.5 rounded-[14px] border border-rule bg-paper px-5 py-14 text-center">
                        <span className="text-[15px] font-semibold">
                            {t('employees.notFoundTitle')}
                        </span>
                        <span className="text-[13px] text-muted">
                            {t('employees.notFoundDescription')}
                        </span>
                    </div>
                )}

                {(loading || employee) && (
                    <section className="flex flex-col overflow-hidden rounded-[14px] border border-rule bg-paper">
                        <div
                            className="relative flex gap-1 overflow-x-auto border-b border-rule px-5 [scrollbar-width:none] max-sm:px-3"
                            ref={tabsRef}
                            role="tablist"
                        >
                            {employeeDetailTabs.map((tab) => {
                                const active = activeTab === tab.id;
                                const badge = tabBadge(tab.id);

                                return (
                                    <button
                                        aria-selected={active}
                                        className={`flex min-h-0 cursor-pointer items-center gap-2 border-0 bg-transparent px-2.5 py-4 text-sm font-medium whitespace-nowrap transition-colors duration-200 hover:text-ink ${
                                            active ? 'text-ink' : 'text-muted'
                                        }`}
                                        data-active={active}
                                        key={tab.id}
                                        role="tab"
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                    >
                                        {t(tab.labelKey)}
                                        {badge && (
                                            <span className="rounded bg-ember-tint px-1.5 py-px text-[11px] font-semibold text-ember-ink">
                                                {badge}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                            <span
                                aria-hidden="true"
                                className="pointer-events-none absolute bottom-0 left-0 h-0.5 bg-ember opacity-0 transition-[transform,width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
                                ref={tabLineRef}
                            />
                        </div>

                        {loading ? (
                            <div className="flex flex-col gap-4 p-7">
                                <span className="h-4 w-40 animate-pulse rounded bg-stone" />
                                <span className="h-10 animate-pulse rounded-lg bg-stone" />
                                <span className="h-10 animate-pulse rounded-lg bg-stone" />
                            </div>
                        ) : (
                            <div className="rise-enter" key={activeTab} role="tabpanel">
                                {renderTab()}
                            </div>
                        )}
                    </section>
                )}
            </div>

            {dirty && (
                <UnsavedChangesBar
                    message={interpolate(t('employees.unsavedChanges'), { name })}
                    saving={saving}
                    onDiscard={discardChanges}
                    onSave={() =>
                        void handleSubmit(saveChanges, () => setActiveTab('info'))()
                    }
                />
            )}

            <ConfirmDialog
                cancelLabel={t('employees.keepEditing')}
                confirmLabel={t('employees.discardConfirm')}
                description={interpolate(t('employees.discardDescription'), { name })}
                open={confirmLeave}
                title={t('employees.discardTitle')}
                tone="danger"
                onCancel={() => setConfirmLeave(false)}
                onConfirm={() => navigate(routes.employees)}
            />
        </section>
    );
}
