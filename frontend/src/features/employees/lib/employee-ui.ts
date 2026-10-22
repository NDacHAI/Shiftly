import { type I18nKey } from '@/i18n';
import { interpolate } from '@/features/dashboard/lib/format';
import { type Employee, type EmployeeStatus } from '../types';

// Warm form controls from frontend/ui/Shiftly Nhan vien.html.
export const warmFieldClass =
    'h-10 w-full rounded-lg border border-rule-strong bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-ink disabled:cursor-not-allowed disabled:border-rule disabled:bg-stone-soft disabled:text-muted aria-invalid:border-ember-strong';

export const warmSelectClass = `${warmFieldClass} cursor-pointer px-2.5`;

export const warmLabelClass =
    'flex min-w-0 flex-col gap-1.5 text-[13px] font-medium text-ink';

export const fieldGridClass =
    'grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-x-4 gap-y-[18px]';

export const primaryButtonClass =
    'flex h-[38px] min-h-0 cursor-pointer items-center justify-center gap-2 rounded-lg border-0 bg-ink px-4 text-[13px] font-medium whitespace-nowrap text-sand transition-colors hover:bg-ink-soft disabled:cursor-wait disabled:opacity-70';

export const secondaryButtonClass =
    'flex h-[38px] min-h-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-rule-strong bg-transparent px-4 text-[13px] font-medium whitespace-nowrap text-ink transition-colors hover:bg-stone-soft disabled:cursor-not-allowed disabled:opacity-60';

export const statusStyles: Record<
    EmployeeStatus,
    { labelKey: I18nKey; pill: string; dot: string }
> = {
    Active: {
        labelKey: 'common.active',
        pill: 'bg-[#dff0e4] text-[#1f6237]',
        dot: 'bg-live',
    },
    Inactive: {
        labelKey: 'common.inactive',
        pill: 'bg-stone text-muted',
        dot: 'bg-faint',
    },
};

// Vietnamese order: family name (lastName) first.
export function employeeFullName(employee: Pick<Employee, 'firstName' | 'lastName'>) {
    return [employee.lastName, employee.firstName]
        .map((part) => part.trim())
        .filter(Boolean)
        .join(' ');
}

export function formatDateDmy(value: string | null | undefined) {
    if (!value) return '—';

    const [year, month, day] = value.slice(0, 10).split('-');

    return `${day}/${month}/${year}`;
}

// Today's date in Vietnam time as YYYY-MM-DD.
export function todayInVietnam() {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh',
    }).format(new Date());
}

export function formatTenure(
    hireDate: string | null | undefined,
    t: (key: I18nKey) => string,
) {
    if (!hireDate) return '—';

    const [startYear, startMonth, startDay] = hireDate.split('-').map(Number);
    const [year, month, day] = todayInVietnam().split('-').map(Number);
    let months = (year - startYear) * 12 + (month - startMonth);

    if (day < startDay) months -= 1;
    if (months < 1) return t('employees.tenureUnderMonth');
    if (months < 12) {
        return interpolate(t('employees.tenureMonths'), { months });
    }

    return interpolate(t('employees.tenureYears'), {
        years: Math.floor(months / 12),
        months: months % 12,
    });
}
