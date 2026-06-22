import { type Employee } from '../../types';
import { useI18n } from '@/i18n';

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

type EmployeeProfileTabProps = {
    employee: Employee;
};

export function EmployeeProfileTab({ employee }: EmployeeProfileTabProps) {
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
