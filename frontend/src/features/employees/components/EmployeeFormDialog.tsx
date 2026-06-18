import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useForm } from 'react-hook-form';
import { useToast } from '@/components/feedback';
import { Button } from '@/components/ui';
import { type Department } from '@/features/departments/types';
import { type Position } from '@/features/positions/types';
import { getEmployeeErrorMessage } from '../api/employees.api';
import {
    type Employee,
    type EmployeePayload,
    type UpdateEmployeePayload,
} from '../types';

type EmployeeFormDialogProps = {
    departments: Department[];
    positions: Position[];
    editing: Employee | null;
    onClose: () => void;
    onSubmit: (
        payload: EmployeePayload | UpdateEmployeePayload,
    ) => Promise<void>;
};

type EmployeeFormValues = Omit<
    EmployeePayload,
    'departmentIds' | 'positionIds'
> & {
    departmentId: string;
    positionId: string;
};

const fieldClass =
    'min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500';

export function EmployeeFormDialog({
    departments,
    positions,
    editing,
    onClose,
    onSubmit,
}: EmployeeFormDialogProps) {
    const { showToast } = useToast();
    const {
        formState: { errors, isSubmitting },
        handleSubmit,
        register,
        setError,
    } = useForm<EmployeeFormValues>({
        defaultValues: {
            employeeCode: editing?.employeeCode ?? '',
            firstName: editing?.firstName ?? '',
            lastName: editing?.lastName ?? '',
            email: editing?.email ?? '',
            phoneNumber: editing?.phoneNumber ?? '',
            dateOfBirth: editing?.dateOfBirth ?? '',
            gender: editing?.gender ?? '',
            departmentId: editing?.departments[0]?.id ?? '',
            positionId: editing?.positions[0]?.id ?? '',
            hireDate: editing?.hireDate ?? '',
            address: editing?.address ?? '',
            status: editing?.status ?? 'Active',
        },
    });

    async function handleValidSubmit(values: EmployeeFormValues) {
        try {
            const payload = {
                ...values,
                employeeCode: values.employeeCode?.trim() || undefined,
                phoneNumber: values.phoneNumber?.trim() || undefined,
                dateOfBirth: values.dateOfBirth || undefined,
                gender: values.gender?.trim() || undefined,
                address: values.address?.trim() || undefined,
                departmentIds: [values.departmentId],
                positionIds: [values.positionId],
            };
            const {
                departmentId: _departmentId,
                positionId: _positionId,
                ...employeePayload
            } = payload;

            if (editing) {
                const { employeeCode: _employeeCode, ...updatePayload } =
                    employeePayload;
                await onSubmit(updatePayload);
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
                title: 'Could not save employee',
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
                        {editing ? 'Update Employee' : 'Add Employee'}
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
                            Employee Code
                            <input
                                className={fieldClass}
                                disabled={Boolean(editing)}
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
                            Status
                            <select
                                className={`${fieldClass} cursor-pointer`}
                                {...register('status', {
                                    required: 'Status is required.',
                                })}
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                            <span className="min-h-4 text-xs font-normal text-red-400" />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            First Name
                            <input
                                className={fieldClass}
                                {...register('firstName', {
                                    required: 'First name is required.',
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
                            Last Name
                            <input
                                className={fieldClass}
                                {...register('lastName', {
                                    required: 'Last name is required.',
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
                            Email
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
                            Phone Number
                            <input
                                className={fieldClass}
                                {...register('phoneNumber')}
                            />
                            <span className="min-h-4 text-xs font-normal text-red-400" />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            Date Of Birth
                            <input
                                className={fieldClass}
                                type="date"
                                {...register('dateOfBirth')}
                            />
                            <span className="min-h-4 text-xs font-normal text-red-400" />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            Gender
                            <select
                                className={`${fieldClass} cursor-pointer`}
                                {...register('gender')}
                            >
                                <option value="">Select gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                            <span className="min-h-4 text-xs font-normal text-red-400" />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            Departments
                            <select
                                className={`${fieldClass} cursor-pointer`}
                                {...register('departmentId', {
                                    required: 'Select a department.',
                                })}
                            >
                                <option value="">Select department</option>
                                {departments.map((department) => (
                                    <option
                                        key={department.id}
                                        value={department.id}
                                    >
                                        {department.name}
                                    </option>
                                ))}
                            </select>
                            <span className="min-h-4 text-xs font-normal text-red-400">
                                {errors.departmentId?.message}
                            </span>
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            Positions
                            <select
                                className={`${fieldClass} cursor-pointer`}
                                {...register('positionId', {
                                    required: 'Select a position.',
                                })}
                            >
                                <option value="">Select position</option>
                                {positions.map((position) => (
                                    <option
                                        key={position.id}
                                        value={position.id}
                                    >
                                        {position.name}
                                    </option>
                                ))}
                            </select>
                            <span className="min-h-4 text-xs font-normal text-red-400">
                                {errors.positionId?.message}
                            </span>
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            Hire Date
                            <input
                                className={fieldClass}
                                type="date"
                                {...register('hireDate', {
                                    required: 'Hire date is required.',
                                })}
                            />
                            <span className="min-h-4 text-xs font-normal text-red-400">
                                {errors.hireDate?.message}
                            </span>
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
                            Address
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
                            Cancel
                        </Button>
                        <Button
                            loading={isSubmitting}
                            loadingLabel="Saving..."
                            type="submit"
                        >
                            Save
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
