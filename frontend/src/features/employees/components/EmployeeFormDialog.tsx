import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useForm, useWatch } from 'react-hook-form';
import { useToast } from '@/components/feedback';
import { Button, DropdownSelect } from '@/components/ui';
import { type Branch } from '@/features/branches/types';
import { type Position } from '@/features/positions/types';
import { useI18n } from '@/i18n';
import { getEmployeeErrorMessage } from '../api/employees.api';
import {
    type Employee,
    type EmployeePayload,
    type EmployeeStatus,
    type UpdateEmployeePayload,
} from '../types';

type EmployeeFormDialogProps = {
    branches: Branch[];
    positions: Position[];
    editing: Employee | null;
    onClose: () => void;
    onSubmit: (
        payload: EmployeePayload | UpdateEmployeePayload,
    ) => Promise<void>;
};

type EmployeeFormValues = Omit<
    EmployeePayload,
    'branchIds' | 'positionIds'
> & {
    branchIds: string[];
    positionId: string;
};

const fieldClass =
    'min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500';

export function EmployeeFormDialog({
    branches,
    positions,
    editing,
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
            employeeCode: editing?.employeeCode ?? '',
            firstName: editing?.firstName ?? '',
            lastName: editing?.lastName ?? '',
            email: editing?.email ?? '',
            phoneNumber: editing?.phoneNumber ?? '',
            dateOfBirth: editing?.dateOfBirth ?? '',
            gender: editing?.gender ?? '',
            branchIds: editing?.branches.map((branch) => branch.id) ?? [],
            positionId: editing?.positions[0]?.id ?? '',
            hireDate: editing?.hireDate ?? '',
            address: editing?.address ?? '',
            status: editing?.status ?? 'Active',
        },
    });
    const status = useWatch({ control, name: 'status' }) ?? 'Active';
    const gender = useWatch({ control, name: 'gender' }) ?? '';
    const branchIds = useWatch({ control, name: 'branchIds' }) ?? [];
    const positionId = useWatch({ control, name: 'positionId' });

    function toggleBranch(branchId: string, checked: boolean) {
        const nextBranchIds = checked
            ? [...new Set([...branchIds, branchId])]
            : branchIds.filter((id) => id !== branchId);

        setValue('branchIds', nextBranchIds, {
            shouldDirty: true,
            shouldValidate: true,
        });
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

            if (editing) {
                await onSubmit({
                    employeeCode: employeePayload.employeeCode,
                    firstName: employeePayload.firstName,
                    lastName: employeePayload.lastName,
                    email: employeePayload.email,
                    phoneNumber: employeePayload.phoneNumber,
                    dateOfBirth: employeePayload.dateOfBirth,
                    gender: employeePayload.gender,
                    branchIds: employeePayload.branchIds,
                    positionIds: employeePayload.positionIds,
                    hireDate: employeePayload.hireDate,
                    address: employeePayload.address,
                    status: employeePayload.status,
                });
            } else {
                await onSubmit(employeePayload);
            }
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
                        {editing ? t('employees.update') : t('employees.add')}
                    </h2>
                    <Button
                        aria-label="Close"
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
                            <span className="min-h-4 text-xs font-normal text-red-400">
                            </span>
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            {t('common.positions')}
                            <input
                                type="hidden"
                                {...register('positionId')}
                            />
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
                            <span className="min-h-4 text-xs font-normal text-red-400">
                            </span>
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            {t('employees.hireDate')}
                            <input
                                className={fieldClass}
                                type="date"
                                {...register('hireDate')}
                            />
                            <span className="min-h-4 text-xs font-normal text-red-400">
                            </span>
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
