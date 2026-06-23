import { type ReactNode } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useToast } from '@/components/feedback';
import { Button, DropdownSelect } from '@/components/ui';
import { type Department } from '@/features/departments/types';
import { type Position } from '@/features/positions/types';
import { useI18n } from '@/i18n';
import { getEmployeeErrorMessage } from '../../api/employees.api';
import {
    type Employee,
    type EmployeePayload,
    type EmployeeStatus,
    type UpdateEmployeePayload,
} from '../../types';

type EmployeeProfileTabProps = {
    canManage: boolean;
    departments: Department[];
    employee: Employee;
    onSave: (payload: UpdateEmployeePayload) => Promise<void>;
    positions: Position[];
};

type EmployeeProfileFormValues = Omit<
    EmployeePayload,
    'departmentIds' | 'positionIds'
> & {
    departmentId: string;
    positionId: string;
};

type ReadonlyItem = {
    label: string;
    value: string;
};

type ReadonlyGroup = {
    title: string;
    items: ReadonlyItem[];
};

const fieldClass =
    'min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500';
const gridClass =
    'grid grid-cols-[repeat(3,minmax(0,1fr))] gap-x-6 gap-y-2 max-lg:grid-cols-[repeat(2,minmax(0,1fr))] max-sm:grid-cols-1';

function fullName(employee: Employee) {
    return `${employee.firstName} ${employee.lastName}`;
}

function formatDate(value: string | null | undefined) {
    if (!value) return '-';
    return new Intl.DateTimeFormat('vi-VN').format(new Date(value));
}

function joinNames(items: Array<{ name: string }>) {
    return items.map((item) => item.name).join(', ') || '-';
}

function ReadonlyProfile({ employee }: { employee: Employee }) {
    const { t } = useI18n();
    const groups: ReadonlyGroup[] = [
        {
            title: t('employees.basicInfo'),
            items: [
                { label: t('employees.employeeCode'), value: employee.employeeCode },
                { label: t('common.fullName'), value: fullName(employee) },
                {
                    label: t('common.status'),
                    value:
                        employee.status === 'Active'
                            ? t('common.active')
                            : t('common.inactive'),
                },
                { label: t('employees.gender'), value: employee.gender || '-' },
                {
                    label: t('employees.dateOfBirth'),
                    value: formatDate(employee.dateOfBirth),
                },
            ],
        },
        {
            title: t('employees.contactInfo'),
            items: [
                { label: t('common.email'), value: employee.email },
                {
                    label: t('employees.phoneNumber'),
                    value: employee.phoneNumber || '-',
                },
                { label: t('employees.address'), value: employee.address || '-' },
            ],
        },
        {
            title: t('employees.workInfo'),
            items: [
                {
                    label: t('common.departments'),
                    value: joinNames(employee.departments),
                },
                { label: t('common.positions'), value: joinNames(employee.positions) },
                {
                    label: t('employees.hireDate'),
                    value: formatDate(employee.hireDate),
                },
            ],
        },
    ];

    return (
        <div className="grid gap-6 p-6">
            {groups.map((group) => (
                <section className="grid gap-3" key={group.title}>
                    <h3 className="text-sm font-bold text-slate-950">
                        {group.title}
                    </h3>
                    <dl className={`${gridClass} gap-y-4`}>
                        {group.items.map((item) => (
                            <div className="min-w-0" key={item.label}>
                                <dt className="text-xs font-semibold text-slate-500">
                                    {item.label}
                                </dt>
                                <dd className="mt-1 truncate text-sm font-medium text-slate-800">
                                    {item.value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </section>
            ))}
        </div>
    );
}

function FieldLabel({
    children,
    error,
    label,
}: {
    children: ReactNode;
    error?: string;
    label: string;
}) {
    return (
        <label className="grid min-w-0 gap-1.5 text-sm font-semibold text-slate-700">
            {label}
            {children}
            <span className="min-h-4 text-xs font-normal text-red-400">
                {error}
            </span>
        </label>
    );
}

export function EmployeeProfileTab({
    canManage,
    departments,
    employee,
    onSave,
    positions,
}: EmployeeProfileTabProps) {
    const { showToast } = useToast();
    const { t } = useI18n();
    const {
        control,
        formState: { errors, isSubmitting },
        handleSubmit,
        register,
        setError,
        setValue,
    } = useForm<EmployeeProfileFormValues>({
        values: {
            employeeCode: employee.employeeCode,
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            phoneNumber: employee.phoneNumber ?? '',
            dateOfBirth: employee.dateOfBirth ?? '',
            gender: employee.gender ?? '',
            departmentId: employee.departments[0]?.id ?? '',
            positionId: employee.positions[0]?.id ?? '',
            hireDate: employee.hireDate,
            address: employee.address ?? '',
            status: employee.status,
        },
    });
    const status = useWatch({ control, name: 'status' }) ?? 'Active';
    const gender = useWatch({ control, name: 'gender' }) ?? '';
    const departmentId = useWatch({ control, name: 'departmentId' });
    const positionId = useWatch({ control, name: 'positionId' });

    async function handleValidSubmit(values: EmployeeProfileFormValues) {
        try {
            await onSave({
                employeeCode: values.employeeCode?.trim() || undefined,
                firstName: values.firstName,
                lastName: values.lastName,
                email: values.email,
                phoneNumber: values.phoneNumber?.trim() || undefined,
                dateOfBirth: values.dateOfBirth || undefined,
                gender: values.gender?.trim() || undefined,
                departmentIds: values.departmentId ? [values.departmentId] : [],
                positionIds: values.positionId ? [values.positionId] : [],
                hireDate: values.hireDate || undefined,
                address: values.address?.trim() || undefined,
                status: values.status,
            });
            showToast({
                message: t('employees.updated'),
                variant: 'success',
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

    if (!canManage) {
        return <ReadonlyProfile employee={employee} />;
    }

    return (
        <form className="grid gap-6 p-6" onSubmit={handleSubmit(handleValidSubmit)}>
            <section className="grid gap-3">
                <h3 className="text-sm font-bold text-slate-950">
                    {t('employees.basicInfo')}
                </h3>
                <div className={gridClass}>
                    <FieldLabel
                        error={errors.employeeCode?.message}
                        label={t('employees.employeeCode')}
                    >
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
                    </FieldLabel>
                    <FieldLabel
                        error={errors.firstName?.message}
                        label={t('employees.firstName')}
                    >
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
                    </FieldLabel>
                    <FieldLabel
                        error={errors.lastName?.message}
                        label={t('employees.lastName')}
                    >
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
                    </FieldLabel>
                    <FieldLabel label={t('common.status')}>
                        <input type="hidden" {...register('status')} />
                        <div className="dropdown-select-field">
                            <DropdownSelect
                                ariaLabel={t('common.status')}
                                options={[
                                    { value: 'Active', label: t('common.active') },
                                    {
                                        value: 'Inactive',
                                        label: t('common.inactive'),
                                    },
                                ]}
                                value={status}
                                onChange={(value) =>
                                    setValue('status', value as EmployeeStatus, {
                                        shouldDirty: true,
                                        shouldValidate: true,
                                    })
                                }
                            />
                        </div>
                    </FieldLabel>
                    <FieldLabel label={t('employees.gender')}>
                        <input type="hidden" {...register('gender')} />
                        <div className="dropdown-select-field">
                            <DropdownSelect
                                ariaLabel={t('employees.gender')}
                                options={[
                                    {
                                        value: '',
                                        label: t('employees.selectGender'),
                                    },
                                    { value: 'Male', label: t('employees.male') },
                                    { value: 'Female', label: t('employees.female') },
                                    { value: 'Other', label: t('employees.other') },
                                ]}
                                value={gender}
                                onChange={(value) =>
                                    setValue('gender', value, { shouldDirty: true })
                                }
                            />
                        </div>
                    </FieldLabel>
                    <FieldLabel label={t('employees.dateOfBirth')}>
                        <input
                            className={fieldClass}
                            type="date"
                            {...register('dateOfBirth')}
                        />
                    </FieldLabel>
                </div>
            </section>

            <section className="grid gap-3">
                <h3 className="text-sm font-bold text-slate-950">
                    {t('employees.contactInfo')}
                </h3>
                <div className={gridClass}>
                    <FieldLabel
                        error={errors.email?.message}
                        label={t('common.email')}
                    >
                        <input
                            className={fieldClass}
                            type="email"
                            {...register('email', {
                                required: 'Email is required.',
                            })}
                        />
                    </FieldLabel>
                    <FieldLabel label={t('employees.phoneNumber')}>
                        <input className={fieldClass} {...register('phoneNumber')} />
                    </FieldLabel>
                    <FieldLabel label={t('employees.address')}>
                        <input className={fieldClass} {...register('address')} />
                    </FieldLabel>
                </div>
            </section>

            <section className="grid gap-3">
                <h3 className="text-sm font-bold text-slate-950">
                    {t('employees.workInfo')}
                </h3>
                <div className={gridClass}>
                    <FieldLabel label={t('common.departments')}>
                        <input type="hidden" {...register('departmentId')} />
                        <div className="dropdown-select-field">
                            <DropdownSelect
                                ariaLabel={t('common.departments')}
                                options={[
                                    {
                                        value: '',
                                        label: t('employees.selectDepartment'),
                                    },
                                    ...departments.map((department) => ({
                                        value: department.id,
                                        label: department.name,
                                    })),
                                ]}
                                value={departmentId}
                                onChange={(value) =>
                                    setValue('departmentId', value, {
                                        shouldDirty: true,
                                        shouldValidate: true,
                                    })
                                }
                            />
                        </div>
                    </FieldLabel>
                    <FieldLabel label={t('common.positions')}>
                        <input type="hidden" {...register('positionId')} />
                        <div className="dropdown-select-field">
                            <DropdownSelect
                                ariaLabel={t('common.positions')}
                                options={[
                                    { value: '', label: t('employees.selectPosition') },
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
                    </FieldLabel>
                    <FieldLabel label={t('employees.hireDate')}>
                        <input
                            className={fieldClass}
                            type="date"
                            {...register('hireDate')}
                        />
                    </FieldLabel>
                </div>
            </section>

            <div className="flex justify-end">
                <Button
                    loading={isSubmitting}
                    loadingLabel={t('common.loadingSave')}
                    type="submit"
                >
                    {t('common.save')}
                </Button>
            </div>
        </form>
    );
}
