import { useEffect, useState, type FormEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faIdCard,
    faKey,
    faRotateRight,
    faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';
import { useToast } from '@/components/feedback';
import { Button, DropdownSelect, EmptyState, LoadingOverlay } from '@/components/ui';
import { roles, type Role } from '@/constants/roles';
import { useI18n } from '@/i18n';
import {
    createEmployeeAccount,
    getEmployeeAccount,
    getEmployeeErrorMessage,
    resetEmployeePassword,
} from '../../api/employees.api';
import { type Employee, type EmployeeAccount } from '../../types';

type EmployeeAccountTabProps = {
    canManage: boolean;
    employee: Employee;
};

function getRoleLabel(role: EmployeeAccount['role'], t: ReturnType<typeof useI18n>['t']) {
    if (role === roles.manager) return t('employees.managerRole');
    if (role === roles.user) return t('employees.employeeRole');

    return role;
}

function AccountDetails({ account }: { account: EmployeeAccount }) {
    const { t } = useI18n();

    return (
        <dl className="grid gap-3">
            <div className="flex justify-between gap-4 border-b border-slate-200 pb-3">
                <dt className="text-sm text-slate-500">Email</dt>
                <dd className="text-sm font-semibold text-slate-900">
                    {account.email}
                </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-200 pb-3">
                <dt className="text-sm text-slate-500">
                    {t('employees.accountRole')}
                </dt>
                <dd className="text-sm font-semibold text-slate-900">
                    {getRoleLabel(account.role, t)}
                </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-200 pb-3">
                <dt className="text-sm text-slate-500">
                    {t('employees.accountStatus')}
                </dt>
                <dd className="text-sm font-semibold text-emerald-700">
                    {account.isActive ? t('common.active') : t('common.inactive')}
                </dd>
            </div>
            <div className="flex justify-between gap-4">
                <dt className="text-sm text-slate-500">
                    {t('employees.accountMustChangePassword')}
                </dt>
                <dd className="text-sm font-semibold text-amber-700">
                    {account.mustChangePassword
                        ? t('employees.accountMustChangeRequired')
                        : t('employees.accountMustChangeNotRequired')}
                </dd>
            </div>
        </dl>
    );
}

export function EmployeeAccountTab({
    canManage,
    employee,
}: EmployeeAccountTabProps) {
    const { showToast } = useToast();
    const { t } = useI18n();
    const [role, setRole] = useState<Role>(roles.user);
    const [temporaryPassword, setTemporaryPassword] = useState('');
    const [account, setAccount] = useState<EmployeeAccount | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [resetting, setResetting] = useState(false);

    useEffect(() => {
        if (!canManage) {
            setLoading(false);
            return;
        }

        let active = true;

        async function loadAccount() {
            setLoading(true);

            try {
                const accountResponse = await getEmployeeAccount(employee.id);

                if (active) {
                    setAccount(accountResponse);
                }
            } catch (error) {
                if (active) {
                    showToast({
                        message: getEmployeeErrorMessage(error),
                        title: t('employees.accountLoadError'),
                        variant: 'error',
                    });
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        void loadAccount();

        return () => {
            active = false;
        };
    }, [canManage, employee.id, showToast, t]);

    async function handleCreate(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSubmitting(true);

        try {
            const createdAccount = await createEmployeeAccount(employee.id, {
                role,
                temporaryPassword,
            });
            setAccount(createdAccount);
            setTemporaryPassword('');
            showToast({
                message: t('employees.accountCreated'),
                variant: 'success',
            });
        } catch (error) {
            showToast({
                message: getEmployeeErrorMessage(error),
                title: t('employees.accountCreateError'),
                variant: 'error',
            });
        } finally {
            setSubmitting(false);
        }
    }

    function generateTemporaryPassword() {
        const randomPart = Math.random().toString(36).slice(2, 10);

        return `Shiftly@${randomPart}`;
    }

    async function handleReset() {
        setResetting(true);

        try {
            const temporaryPassword = generateTemporaryPassword();
            const updatedAccount = await resetEmployeePassword(employee.id, {
                temporaryPassword,
            });
            setAccount(updatedAccount);
            showToast({
                message: t('employees.passwordReset'),
                variant: 'success',
            });
        } catch (error) {
            showToast({
                message: getEmployeeErrorMessage(error),
                title: t('employees.passwordResetError'),
                variant: 'error',
            });
        } finally {
            setResetting(false);
        }
    }

    if (!canManage) {
        return (
            <EmptyState
                description={t('employees.accountAccessDeniedDescription')}
                icon={<FontAwesomeIcon icon={faShieldHalved} />}
                title={t('employees.accountAccessDeniedTitle')}
            />
        );
    }

    return (
        <div className="relative grid gap-6 p-6 lg:grid-cols-[minmax(0,420px)_1fr]">
            <LoadingOverlay label={t('employees.accountLoading')} visible={loading} />
            {!account ? (
                <form
                    className="grid content-start gap-4 rounded-xl border border-slate-200 bg-white p-5"
                    onSubmit={handleCreate}
                >
                    <div>
                        <h3 className="text-base font-bold text-slate-950">
                            {t('employees.createLoginAccount')}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                            {employee.email}
                        </p>
                    </div>

                    <label className="grid gap-2 text-sm font-semibold text-slate-700">
                        {t('employees.accountRole')}
                        <div className="dropdown-select-field">
                            <DropdownSelect
                                ariaLabel={t('employees.accountRoleAria')}
                                options={[
                                    {
                                        value: roles.user,
                                        label: t('employees.employeeRole'),
                                    },
                                    {
                                        value: roles.manager,
                                        label: t('employees.managerRole'),
                                    },
                                ]}
                                value={role}
                                onChange={(value) => setRole(value as Role)}
                            />
                        </div>
                    </label>

                    <label className="grid gap-2 text-sm font-semibold text-slate-700">
                        {t('employees.temporaryPassword')}
                        <span className="relative">
                            <FontAwesomeIcon
                                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
                                icon={faKey}
                            />
                            <input
                                className="min-h-11 w-full rounded-lg border border-slate-200 bg-white pr-3 pl-9 text-sm text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                                minLength={6}
                                required
                                type="password"
                                value={temporaryPassword}
                                onChange={(event) =>
                                    setTemporaryPassword(event.target.value)
                                }
                            />
                        </span>
                    </label>

                    <Button
                        loading={submitting}
                        loadingLabel={t('employees.creatingAccount')}
                        size="lg"
                        type="submit"
                    >
                        <FontAwesomeIcon icon={faIdCard} />
                        {t('employees.createAccount')}
                    </Button>
                </form>
            ) : (
                <div className="grid content-start gap-4 rounded-xl border border-slate-200 bg-white p-5">
                    <div>
                        <h3 className="text-base font-bold text-slate-950">
                            {t('employees.resetPassword')}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                            {t('employees.accountExistsFor').replace(
                                '{email}',
                                employee.email,
                            )}
                        </p>
                    </div>

                    <Button
                        loading={resetting}
                        loadingLabel={t('employees.resettingPassword')}
                        onClick={() => void handleReset()}
                        size="lg"
                        variant="secondary"
                    >
                        <FontAwesomeIcon icon={faRotateRight} />
                        {t('employees.resetPassword')}
                    </Button>
                </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-base font-bold text-slate-950">
                    {t('employees.accountInfo')}
                </h3>
                <div className="mt-4">
                    {account ? (
                        <AccountDetails account={account} />
                    ) : (
                        <EmptyState
                            description={t('employees.noAccountDescription')}
                            icon={<FontAwesomeIcon icon={faIdCard} />}
                            title={t('employees.noAccountTitle')}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
