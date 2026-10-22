import { type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { useI18n } from '@/i18n';
import {
    fieldGridClass,
    warmFieldClass,
    warmLabelClass,
    warmSelectClass,
} from '../../lib/employee-ui';
import { DetailSection } from './DetailSection';
import { type EmployeeDetailFormValues } from './employee-detail-tabs';

type EmployeeInfoTabProps = {
    disabled: boolean;
    employeeCode: string;
    errors: FieldErrors<EmployeeDetailFormValues>;
    register: UseFormRegister<EmployeeDetailFormValues>;
};

function FieldError({ message }: { message?: string }) {
    if (!message) return null;

    return <span className="text-xs font-normal text-ember-strong">{message}</span>;
}

export function EmployeeInfoTab({
    disabled,
    employeeCode,
    errors,
    register,
}: EmployeeInfoTabProps) {
    const { t } = useI18n();
    const requiredText = (value: string) =>
        value.trim() !== '' || t('common.required');

    return (
        <div className="flex flex-col">
            <DetailSection
                divided
                hint={t('employees.basicInfoHint')}
                title={t('employees.basicInfo')}
            >
                <div className={fieldGridClass}>
                    <label className={warmLabelClass}>
                        {t('employees.employeeCode')}
                        <input
                            className={`${warmFieldClass} tabular-nums`}
                            disabled
                            value={employeeCode}
                        />
                    </label>
                    <label className={warmLabelClass}>
                        {t('employees.lastName')}
                        <input
                            aria-invalid={Boolean(errors.lastName)}
                            className={warmFieldClass}
                            disabled={disabled}
                            placeholder={t('employees.lastNamePlaceholder')}
                            {...register('lastName', { validate: requiredText })}
                        />
                        <FieldError message={errors.lastName?.message} />
                    </label>
                    <label className={warmLabelClass}>
                        {t('employees.firstName')}
                        <input
                            aria-invalid={Boolean(errors.firstName)}
                            className={warmFieldClass}
                            disabled={disabled}
                            placeholder={t('employees.firstNamePlaceholder')}
                            {...register('firstName', { validate: requiredText })}
                        />
                        <FieldError message={errors.firstName?.message} />
                    </label>
                    <label className={warmLabelClass}>
                        {t('employees.gender')}
                        <select
                            className={warmSelectClass}
                            disabled={disabled}
                            {...register('gender')}
                        >
                            <option value="">{t('employees.selectGender')}</option>
                            <option value="Male">{t('employees.male')}</option>
                            <option value="Female">{t('employees.female')}</option>
                            <option value="Other">{t('employees.other')}</option>
                        </select>
                    </label>
                    <label className={warmLabelClass}>
                        {t('employees.dateOfBirth')}
                        <input
                            className={warmFieldClass}
                            disabled={disabled}
                            type="date"
                            {...register('dateOfBirth')}
                        />
                    </label>
                    <label className={warmLabelClass}>
                        {t('common.status')}
                        <select
                            className={warmSelectClass}
                            disabled={disabled}
                            {...register('status')}
                        >
                            <option value="Active">{t('common.active')}</option>
                            <option value="Inactive">{t('common.inactive')}</option>
                        </select>
                    </label>
                </div>
            </DetailSection>

            <DetailSection
                hint={t('employees.contactHint')}
                title={t('employees.contactInfo')}
            >
                <div className={fieldGridClass}>
                    <label className={warmLabelClass}>
                        {t('common.email')}
                        <input
                            aria-invalid={Boolean(errors.email)}
                            className={warmFieldClass}
                            disabled={disabled}
                            placeholder={t('employees.emailPlaceholder')}
                            type="email"
                            {...register('email', { validate: requiredText })}
                        />
                        <FieldError message={errors.email?.message} />
                    </label>
                    <label className={warmLabelClass}>
                        {t('employees.phoneNumber')}
                        <input
                            className={warmFieldClass}
                            disabled={disabled}
                            placeholder={t('employees.phonePlaceholder')}
                            {...register('phoneNumber')}
                        />
                    </label>
                    <label className={`${warmLabelClass} col-span-full`}>
                        {t('employees.address')}
                        <input
                            className={warmFieldClass}
                            disabled={disabled}
                            placeholder={t('employees.addressPlaceholder')}
                            {...register('address')}
                        />
                    </label>
                </div>
            </DetailSection>
        </div>
    );
}
