import { useState, type FormEvent } from 'react';
import { useToast } from '@/components/feedback';
import { roles, type Role } from '@/constants/roles';
import { interpolate } from '@/features/dashboard/lib/format';
import { useI18n } from '@/i18n';
import {
    createEmployeeAccount,
    getEmployeeErrorKey,
    resetEmployeePassword,
} from '../../api/employees.api';
import {
    fieldGridClass,
    primaryButtonClass,
    secondaryButtonClass,
    warmFieldClass,
    warmLabelClass,
    warmSelectClass,
} from '../../lib/employee-ui';
import { type Employee, type EmployeeAccount } from '../../types';
import { DetailSection } from './DetailSection';

type EmployeeAccountTabProps = {
    account: EmployeeAccount | null;
    canManage: boolean;
    employee: Employee;
    loading: boolean;
    role: Role;
    onAccountChange: (account: EmployeeAccount) => void;
    onRoleChange: (role: Role) => void;
};

export function EmployeeAccountTab({
    account,
    canManage,
    employee,
    loading,
    role,
    onAccountChange,
    onRoleChange,
}: EmployeeAccountTabProps) {
    const { showToast } = useToast();
    const { t } = useI18n();
    const [creating, setCreating] = useState(false);
    const [newRole, setNewRole] = useState<Role>(roles.user);
    const [temporaryPassword, setTemporaryPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [resetting, setResetting] = useState(false);

    async function handleCreate(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSubmitting(true);

        try {
            const createdAccount = await createEmployeeAccount(employee.id, {
                role: newRole,
                temporaryPassword,
            });
            onAccountChange(createdAccount);
            setTemporaryPassword('');
            setCreating(false);
            showToast({
                message: t('employees.accountCreated'),
                variant: 'success',
            });
        } catch (error) {
            showToast({
                message: t(getEmployeeErrorKey(error)),
                title: t('employees.accountCreateError'),
                variant: 'error',
            });
        } finally {
            setSubmitting(false);
        }
    }

    async function handleReset() {
        setResetting(true);

        try {
            const updatedAccount = await resetEmployeePassword(employee.id);
            onAccountChange(updatedAccount);
            showToast({
                message: interpolate(t('employees.passwordReset'), {
                    email: updatedAccount.email,
                }),
                variant: 'success',
            });
        } catch (error) {
            showToast({
                message: t(getEmployeeErrorKey(error)),
                title: t('employees.passwordResetError'),
                variant: 'error',
            });
        } finally {
            setResetting(false);
        }
    }

    function renderBody() {
        if (!canManage) {
            return (
                <div className="flex flex-col gap-1 rounded-xl border border-dashed border-[#cfcabe] p-7">
                    <span className="text-[15px] font-semibold">
                        {t('employees.accountAccessDeniedTitle')}
                    </span>
                    <span className="text-[13px] text-muted">
                        {t('employees.accountAccessDeniedDescription')}
                    </span>
                </div>
            );
        }

        if (loading) {
            return (
                <div
                    aria-label={t('employees.accountLoading')}
                    className="h-[120px] animate-pulse rounded-xl bg-stone"
                    role="status"
                />
            );
        }

        if (!account) {
            return (
                <div className="flex flex-col gap-5 rounded-xl border border-dashed border-[#cfcabe] p-7 max-sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-[15px] font-semibold">
                                {t('employees.noAccountTitle')}
                            </span>
                            <span className="text-[13px] text-muted">
                                {interpolate(t('employees.accountWillBeCreatedFor'), {
                                    email: employee.email,
                                })}
                            </span>
                        </div>
                        {!creating && (
                            <button
                                className={primaryButtonClass}
                                type="button"
                                onClick={() => setCreating(true)}
                            >
                                {t('employees.createAccount')}
                            </button>
                        )}
                    </div>

                    {creating && (
                        <form className="rise-enter flex flex-col gap-4" onSubmit={handleCreate}>
                            <div className={fieldGridClass}>
                                <label className={warmLabelClass}>
                                    {t('employees.accountRole')}
                                    <select
                                        className={warmSelectClass}
                                        value={newRole}
                                        onChange={(event) =>
                                            setNewRole(event.target.value as Role)
                                        }
                                    >
                                        <option value={roles.user}>
                                            {t('employees.employeeRole')}
                                        </option>
                                        <option value={roles.manager}>
                                            {t('employees.managerRole')}
                                        </option>
                                    </select>
                                </label>
                                <label className={warmLabelClass}>
                                    {t('employees.temporaryPassword')}
                                    <input
                                        autoComplete="new-password"
                                        className={warmFieldClass}
                                        minLength={6}
                                        required
                                        type="password"
                                        value={temporaryPassword}
                                        onChange={(event) =>
                                            setTemporaryPassword(event.target.value)
                                        }
                                    />
                                </label>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    className={secondaryButtonClass}
                                    disabled={submitting}
                                    type="button"
                                    onClick={() => setCreating(false)}
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    className={primaryButtonClass}
                                    disabled={submitting}
                                    type="submit"
                                >
                                    {submitting
                                        ? t('employees.creatingAccount')
                                        : t('employees.createAccount')}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            );
        }

        const roleOptions: Role[] = [roles.user, roles.manager];

        if (!roleOptions.includes(account.role)) roleOptions.push(account.role);

        return (
            <>
                <div className={fieldGridClass}>
                    <label className={warmLabelClass}>
                        {t('employees.loginEmail')}
                        <input
                            className={`${warmFieldClass} tabular-nums`}
                            disabled
                            value={account.email}
                        />
                    </label>
                    <label className={warmLabelClass}>
                        {t('employees.accountRole')}
                        <select
                            className={warmSelectClass}
                            value={role}
                            onChange={(event) => onRoleChange(event.target.value as Role)}
                        >
                            {roleOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option === roles.manager
                                        ? t('employees.managerRole')
                                        : option === roles.user
                                          ? t('employees.employeeRole')
                                          : t('header.roles.admin')}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-rule px-4 py-3.5">
                    <span className="flex items-center gap-2 text-[13px] text-muted">
                        <span
                            className={`size-1.5 rounded-full ${
                                account.isActive ? 'bg-live' : 'bg-faint'
                            }`}
                        />
                        {account.isActive
                            ? t('employees.accountActive')
                            : t('employees.accountDisabled')}
                        {' · '}
                        {account.mustChangePassword
                            ? t('employees.accountPendingPasswordChange')
                            : t('employees.accountPasswordChanged')}
                    </span>
                    <button
                        className="h-8 min-h-0 cursor-pointer rounded-md border border-rule-strong bg-transparent px-3 text-xs font-medium text-ink transition-colors hover:bg-stone-soft disabled:cursor-wait disabled:opacity-60"
                        disabled={resetting}
                        type="button"
                        onClick={() => void handleReset()}
                    >
                        {resetting
                            ? t('employees.resettingPassword')
                            : t('employees.resetPassword')}
                    </button>
                </div>
            </>
        );
    }

    return (
        <DetailSection
            hint={t('employees.accountHint')}
            title={t('employees.accountSection')}
        >
            {renderBody()}
        </DetailSection>
    );
}
