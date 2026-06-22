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

function AccountDetails({ account }: { account: EmployeeAccount }) {
    return (
        <dl className="grid gap-3">
            <div className="flex justify-between gap-4 border-b border-slate-200 pb-3">
                <dt className="text-sm text-slate-500">Email</dt>
                <dd className="text-sm font-semibold text-slate-900">
                    {account.email}
                </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-200 pb-3">
                <dt className="text-sm text-slate-500">Vai trò</dt>
                <dd className="text-sm font-semibold text-slate-900">
                    {account.role}
                </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-200 pb-3">
                <dt className="text-sm text-slate-500">Trạng thái</dt>
                <dd className="text-sm font-semibold text-emerald-700">
                    {account.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                </dd>
            </div>
            <div className="flex justify-between gap-4">
                <dt className="text-sm text-slate-500">Đổi mật khẩu</dt>
                <dd className="text-sm font-semibold text-amber-700">
                    {account.mustChangePassword
                        ? 'Bắt buộc'
                        : 'Không bắt buộc'}
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
                        title: 'Không thể tải tài khoản',
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
    }, [canManage, employee.id, showToast]);

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
                message: 'Tài khoản nhân viên đã được tạo.',
                variant: 'success',
            });
        } catch (error) {
            showToast({
                message: getEmployeeErrorMessage(error),
                title: 'Không thể tạo tài khoản',
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
                message: 'Mật khẩu tạm thời đã được cập nhật.',
                variant: 'success',
            });
        } catch (error) {
            showToast({
                message: getEmployeeErrorMessage(error),
                title: 'Không thể reset mật khẩu',
                variant: 'error',
            });
        } finally {
            setResetting(false);
        }
    }

    if (!canManage) {
        return (
            <EmptyState
                description="Bạn không có quyền quản lý tài khoản nhân viên này."
                icon={<FontAwesomeIcon icon={faShieldHalved} />}
                title="Không có quyền truy cập"
            />
        );
    }

    return (
        <div className="relative grid gap-6 p-6 lg:grid-cols-[minmax(0,420px)_1fr]">
            <LoadingOverlay label="Đang tải tài khoản..." visible={loading} />
            {!account ? (
                <form
                    className="grid content-start gap-4 rounded-xl border border-slate-200 bg-white p-5"
                    onSubmit={handleCreate}
                >
                    <div>
                        <h3 className="text-base font-bold text-slate-950">
                            Tạo tài khoản đăng nhập
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                            {employee.email}
                        </p>
                    </div>

                    <label className="grid gap-2 text-sm font-semibold text-slate-700">
                        Vai trò
                        <DropdownSelect
                            ariaLabel="Vai trò tài khoản"
                            options={[
                                { value: roles.user, label: 'Nhân viên' },
                                { value: roles.manager, label: 'Quản lý' },
                            ]}
                            value={role}
                            onChange={(value) => setRole(value as Role)}
                        />
                    </label>

                    <label className="grid gap-2 text-sm font-semibold text-slate-700">
                        Mật khẩu tạm thời
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
                        loadingLabel="Đang tạo..."
                        size="lg"
                        type="submit"
                    >
                        <FontAwesomeIcon icon={faIdCard} />
                        Tạo tài khoản
                    </Button>
                </form>
            ) : (
                <div
                    className="grid content-start gap-4 rounded-xl border border-slate-200 bg-white p-5"
                >
                    <div>
                        <h3 className="text-base font-bold text-slate-950">
                            Reset mật khẩu
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                            Tài khoản đã tồn tại cho {employee.email}
                        </p>
                    </div>

                    <Button
                        loading={resetting}
                        loadingLabel="Đang reset..."
                        onClick={() => void handleReset()}
                        size="lg"
                        variant="secondary"
                    >
                        <FontAwesomeIcon icon={faRotateRight} />
                        Reset mật khẩu
                    </Button>
                </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-base font-bold text-slate-950">
                    Thông tin tài khoản
                </h3>
                <div className="mt-4">
                    {account ? (
                        <AccountDetails account={account} />
                    ) : (
                        <EmptyState
                            description="Nhân viên này chưa có tài khoản đăng nhập."
                            icon={<FontAwesomeIcon icon={faIdCard} />}
                            title="Chưa có tài khoản"
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
