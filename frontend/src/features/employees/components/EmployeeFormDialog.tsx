import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useForm, useWatch } from 'react-hook-form';
import { useToast } from '@/components/feedback';
import { Button, DropdownSelect } from '@/components/ui';
import { roles, type Role } from '@/constants/roles';
import { type Branch } from '@/features/branches/types';
import { type Position } from '@/features/positions/types';
import { useI18n } from '@/i18n';
import { getEmployeeErrorMessage } from '../api/employees.api';
import {
    type EmployeePayload,
    type EmployeeStatus,
} from '../types';

export type EmployeeFormSubmit = {
    employee: EmployeePayload;
    account?: {
        action: 'create';
        role: Role;
        temporaryPassword: string;
    };
};

type EmployeeFormDialogProps = {
    branches: Branch[];
    positions: Position[];
    onClose: () => void;
    onSubmit: (payload: EmployeeFormSubmit) => Promise<void>;
};

type EmployeeFormValues = Omit<
    EmployeePayload,
    'branchIds' | 'positionIds'
> & {
    branchIds: string[];
    positionId: string;
    accountRole: Role;
    createAccount: boolean;
    temporaryPassword: string;
};

const fieldClass =
    'min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500';

export function EmployeeFormDialog({
    branches,
    positions,
    onClose,
    onSubmit,
}: EmployeeFormDialogProps) {
    const { showToast } = useToast();
    const { t } = useI18n();
    const {
        control,
        formState: { errors, isSubmitting },
        handleSubmit,
        register,
        setError,
        setValue,
    } = useForm<EmployeeFormValues>({
        defaultValues: {
            employeeCode: '',
            firstName: '',
            lastName: '',
            email: '',
            phoneNumber: '',
            dateOfBirth: '',
            gender: '',
            branchIds: [],
            positionId: '',
            hireDate: '',
            address: '',
            status: 'Active',
            accountRole: roles.user,
            createAccount: false,
            temporaryPassword: '',
        },
    });
    const status = useWatch({ control, name: 'status' }) ?? 'Active';
    const gender = useWatch({ control, name: 'gender' }) ?? '';
    const branchIds = useWatch({ control, name: 'branchIds' }) ?? [];
    const positionId = useWatch({ control, name: 'positionId' });
    const accountRole = useWatch({ control, name: 'accountRole' }) ?? roles.user;
    const createAccount = useWatch({ control, name: 'createAccount' }) ?? false;

    function toggleBranch(branchId: string, checked: boolean) {
        const nextBranchIds = checked
            ? [...new Set([...branchIds, branchId])]
            : branchIds.filter((id) => id !== branchId);

        setValue('branchIds', nextBranchIds, {
            shouldDirty: true,
            shouldValidate: true,
        });
    }

    function buildAccountPayload(values: EmployeeFormValues) {
        if (values.createAccount) {
            return {
                action: 'create' as const,
                role: values.accountRole,
                temporaryPassword: values.temporaryPassword,
            };
        }

        return undefined;
    }

    async function handleValidSubmit(values: EmployeeFormValues) {
        try {
            const employeePayload: EmployeePayload = {
                firstName: values.firstName,
                lastName: values.lastName,
                email: values.email,
                employeeCode: values.employeeCode?.trim() || undefined,
                phoneNumber: values.phoneNumber?.trim() || undefined,
                dateOfBirth: values.dateOfBirth || undefined,
                gender: values.gender?.trim() || undefined,
                hireDate: values.hireDate,
                address: values.address?.trim() || undefined,
                status: values.status,
                branchIds: values.branchIds ?? [],
                positionIds: values.positionId ? [values.positionId] : [],
            };

            await onSubmit({
                employee: employeePayload,
                account: buildAccountPayload(values),
            });
        } catch (error) {
            const message = getEmployeeErrorMessage(error);

            if (message.toLowerCase().includes('email')) {
                setError('email', { message, type: 'server' });
                return;
            }

            if (message.toLowerCase().includes('code')) {
                setError('employeeCode', { message, type: 'server' });
                return;
            }

            showToast({
                message,
                title: t('employees.saveError'),
                variant: 'error',
            });
        }
    }

    return (
        <div className="dialog-backdrop fixed inset-0 z-40 flex items-center justify-center bg-slate-950/55 p-5">
            <div
                aria-modal="true"
                className="dialog-panel flex max-h-[calc(100vh-40px)] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
                role="dialog"
            >
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                    <h2 className="text-xl font-bold text-slate-950">
                        {t('employees.add')}
                    </h2>
                    <Button
                        aria-label={t('common.close')}
                        disabled={isSubmitting}
                        onClick={onClose}
                        size="icon"
                        variant="ghost"
                    >
                        <FontAwesomeIcon icon={faXmark} />
                    </Button>
                </div>
                <form
                    className="flex min-h-0 flex-1 flex-col"
                    onSubmit={handleSubmit(handleValidSubmit)}
                >
                    <div className="grid grid-cols-2 gap-4 overflow-y-auto px-6 py-5 max-md:grid-cols-1">
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            {t('employees.employeeCode')}
                            <input
                                className={fieldClass}
                                placeholder="Auto: NV0001"
                                {...register('employeeCode', {
                                    maxLength: {
                                        message: 'Maximum 50 characters.',
                                        value: 50,
                                    },
                                })}
                            />
                            <span className="min-h-4 text-xs font-normal text-red-400">
                                {errors.employeeCode?.message}
                            </span>
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            {t('common.status')}
                            <input
                                type="hidden"
                                {...register('status', {
                                    required: t('common.required'),
                                })}
                            />
                            <div className="dropdown-select-field">
                                <DropdownSelect
                                    ariaLabel={t('common.status')}
                                    options={[
                                        {
                                            value: 'Active',
                                            label: t('common.active'),
                                        },
                                        {
                                            value: 'Inactive',
                                            label: t('common.inactive'),
                                        },
                                    ]}
                                    value={status}
                                    onChange={(value) =>
                                        setValue(
                                            'status',
                                            value as EmployeeStatus,
                                            {
                                                shouldDirty: true,
                                                shouldValidate: true,
                                            },
                                        )
                                    }
                                />
                            </div>
                            <span className="min-h-4 text-xs font-normal text-red-400" />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            {t('employees.firstName')}
                            <input
                                className={fieldClass}
                                {...register('firstName', {
                                    required: t('common.required'),
                                    maxLength: {
                                        message: 'Maximum 100 characters.',
                                        value: 100,
                                    },
                                })}
                            />
                            <span className="min-h-4 text-xs font-normal text-red-400">
                                {errors.firstName?.message}
                            </span>
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            {t('employees.lastName')}
                            <input
                                className={fieldClass}
                                {...register('lastName', {
                                    required: t('common.required'),
                                    maxLength: {
                                        message: 'Maximum 100 characters.',
                                        value: 100,
                                    },
                                })}
                            />
                            <span className="min-h-4 text-xs font-normal text-red-400">
                                {errors.lastName?.message}
                            </span>
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            {t('common.email')}
                            <input
                                className={fieldClass}
                                type="email"
                                {...register('email', {
                                    required: 'Email is required.',
                                })}
                            />
                            <span className="min-h-4 text-xs font-normal text-red-400">
                                {errors.email?.message}
                            </span>
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            {t('employees.phoneNumber')}
                            <input
                                className={fieldClass}
                                {...register('phoneNumber')}
                            />
                            <span className="min-h-4 text-xs font-normal text-red-400" />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            {t('employees.dateOfBirth')}
                            <input
                                className={fieldClass}
                                type="date"
                                {...register('dateOfBirth')}
                            />
                            <span className="min-h-4 text-xs font-normal text-red-400" />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            {t('employees.gender')}
                            <input type="hidden" {...register('gender')} />
                            <div className="dropdown-select-field">
                                <DropdownSelect
                                    ariaLabel={t('employees.gender')}
                                    options={[
                                        {
                                            value: '',
                                            label: t('employees.selectGender'),
                                        },
                                        {
                                            value: 'Male',
                                            label: t('employees.male'),
                                        },
                                        {
                                            value: 'Female',
                                            label: t('employees.female'),
                                        },
                                        {
                                            value: 'Other',
                                            label: t('employees.other'),
                                        },
                                    ]}
                                    value={gender}
                                    onChange={(value) =>
                                        setValue('gender', value, {
                                            shouldDirty: true,
                                        })
                                    }
                                />
                            </div>
                            <span className="min-h-4 text-xs font-normal text-red-400" />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            {t('common.branches')}
                            <div className="grid max-h-36 gap-2 overflow-y-auto rounded-lg border border-slate-200 bg-white p-3">
                                {branches.map((branch) => (
                                    <label
                                        className="flex items-center gap-2 text-sm font-medium text-slate-700"
                                        key={branch.id}
                                    >
                                        <input
                                            checked={branchIds.includes(branch.id)}
                                            className="size-4 accent-primary-600"
                                            type="checkbox"
                                            onChange={(event) =>
                                                toggleBranch(
                                                    branch.id,
                                                    event.target.checked,
                                                )
                                            }
                                        />
                                        <span>{branch.name}</span>
                                    </label>
                                ))}
                            </div>
                            <span className="min-h-4 text-xs font-normal text-red-400" />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            {t('common.positions')}
                            <input type="hidden" {...register('positionId')} />
                            <div className="dropdown-select-field">
                                <DropdownSelect
                                    ariaLabel={t('common.positions')}
                                    options={[
                                        {
                                            value: '',
                                            label: t('employees.selectPosition'),
                                        },
                                        ...positions.map((position) => ({
                                            value: position.id,
                                            label: position.name,
                                        })),
                                    ]}
                                    value={positionId}
                                    onChange={(value) =>
                                        setValue('positionId', value, {
                                            shouldDirty: true,
                                            shouldValidate: true,
                                        })
                                    }
                                />
                            </div>
                            <span className="min-h-4 text-xs font-normal text-red-400" />
                        </label>
                        <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:col-span-2">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">
                                    {t('employees.accountInfo')}
                                </h3>
                                <p className="mt-1 text-xs text-slate-500">
                                    {t('employees.noAccountDescription')}
                                </p>
                            </div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <input
                                    className="size-4 accent-primary-600"
                                    type="checkbox"
                                    {...register('createAccount')}
                                />
                                <span>{t('employees.createLoginAccount')}</span>
                            </label>
                            {createAccount && (
                                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                                    {t('employees.accountRole')}
                                    <input
                                        type="hidden"
                                        {...register('accountRole')}
                                    />
                                    <div className="dropdown-select-field">
                                        <DropdownSelect
                                            ariaLabel={t(
                                                'employees.accountRoleAria',
                                            )}
                                            options={[
                                                {
                                                    value: roles.user,
                                                    label: t(
                                                        'employees.employeeRole',
                                                    ),
                                                },
                                                {
                                                    value: roles.manager,
                                                    label: t(
                                                        'employees.managerRole',
                                                    ),
                                                },
                                            ]}
                                            value={accountRole}
                                            onChange={(value) =>
                                                setValue(
                                                    'accountRole',
                                                    value as Role,
                                                    {
                                                        shouldDirty: true,
                                                        shouldValidate: true,
                                                    },
                                                )
                                            }
                                        />
                                    </div>
                                </label>
                            )}
                            {createAccount && (
                                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                                    {t('employees.temporaryPassword')}
                                    <input
                                        className={fieldClass}
                                        minLength={6}
                                        type="password"
                                        {...register('temporaryPassword', {
                                            minLength: {
                                                message: t('common.required'),
                                                value: 6,
                                            },
                                            required: t('common.required'),
                                        })}
                                    />
                                    <span className="min-h-4 text-xs font-normal text-red-400">
                                        {errors.temporaryPassword?.message}
                                    </span>
                                </label>
                            )}
                        </div>
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            {t('employees.hireDate')}
                            <input
                                className={fieldClass}
                                type="date"
                                {...register('hireDate')}
                            />
                            <span className="min-h-4 text-xs font-normal text-red-400" />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
                            {t('employees.address')}
                            <textarea
                                className={`${fieldClass} min-h-24 py-3`}
                                rows={3}
                                {...register('address')}
                            />
                        </label>
                    </div>
                    <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
                        <Button
                            disabled={isSubmitting}
                            onClick={onClose}
                            variant="secondary"
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            loading={isSubmitting}
                            loadingLabel={t('common.loadingSave')}
                            type="submit"
                        >
                            {t('common.save')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
