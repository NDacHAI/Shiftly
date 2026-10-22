import { useEffect, useId, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useForm, useWatch } from 'react-hook-form';
import { useToast } from '@/components/feedback';
import { roles, type Role } from '@/constants/roles';
import { type Branch } from '@/features/branches/types';
import { type Position } from '@/features/positions/types';
import { useI18n } from '@/i18n';
import { getEmployeeErrorKey, getEmployeeErrorMessage } from '../api/employees.api';
import {
    primaryButtonClass,
    secondaryButtonClass,
    todayInVietnam,
    warmFieldClass,
    warmLabelClass,
    warmSelectClass,
} from '../lib/employee-ui';
import { type EmployeePayload } from '../types';
import { BranchChips } from './BranchChips';

export type EmployeeAddSubmit = {
    employee: EmployeePayload;
    account?: {
        role: Role;
        temporaryPassword: string;
    };
};

type EmployeeAddDrawerProps = {
    branches: Branch[];
    positions: Position[];
    onClose: () => void;
    onSubmit: (payload: EmployeeAddSubmit) => Promise<void>;
};

type AddFormValues = {
    lastName: string;
    firstName: string;
    gender: string;
    dateOfBirth: string;
    email: string;
    phoneNumber: string;
    branchIds: string[];
    positionId: string;
    hireDate: string;
    createAccount: boolean;
    accountRole: Role;
    temporaryPassword: string;
};

function Section({ index, title, children }: { index: string; title: string; children: ReactNode }) {
    return (
        <div className="flex flex-col gap-3.5 border-b border-rule-soft py-[18px] last:border-b-0">
            <span className="tabular-nums text-[11px] tracking-[0.06em] text-muted uppercase">
                {index} · {title}
            </span>
            {children}
        </div>
    );
}

function FieldError({ message }: { message?: string }) {
    if (!message) return null;

    return <span className="text-xs font-normal text-ember-strong">{message}</span>;
}

// Right-hand drawer for creating an employee. It animates out before calling onClose.
export function EmployeeAddDrawer({
    branches,
    positions,
    onClose,
    onSubmit,
}: EmployeeAddDrawerProps) {
    const { showToast } = useToast();
    const { t } = useI18n();
    const titleId = useId();
    const [closing, setClosing] = useState(false);
    const {
        control,
        formState: { errors, isSubmitting, submitCount },
        handleSubmit,
        register,
        setError,
        setValue,
    } = useForm<AddFormValues>({
        defaultValues: {
            lastName: '',
            firstName: '',
            gender: '',
            dateOfBirth: '',
            email: '',
            phoneNumber: '',
            branchIds: [],
            positionId: '',
            hireDate: todayInVietnam(),
            createAccount: false,
            accountRole: roles.user,
            temporaryPassword: '',
        },
    });
    const branchIds = useWatch({ control, name: 'branchIds' });
    const createAccount = useWatch({ control, name: 'createAccount' });
    const branchMissing = submitCount > 0 && branchIds.length === 0;

    function requestClose() {
        if (isSubmitting) return;
        setClosing(true);
    }

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape' && !isSubmitting) setClosing(true);
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSubmitting]);

    function toggleBranch(branchId: string) {
        setValue(
            'branchIds',
            branchIds.includes(branchId)
                ? branchIds.filter((id) => id !== branchId)
                : [...branchIds, branchId],
            { shouldDirty: true },
        );
    }

    async function handleValidSubmit(values: AddFormValues) {
        if (values.branchIds.length === 0) return;

        try {
            await onSubmit({
                employee: {
                    firstName: values.firstName.trim(),
                    lastName: values.lastName.trim(),
                    email: values.email.trim(),
                    phoneNumber: values.phoneNumber.trim() || undefined,
                    dateOfBirth: values.dateOfBirth || undefined,
                    gender: values.gender || undefined,
                    hireDate: values.hireDate || undefined,
                    status: 'Active',
                    branchIds: values.branchIds,
                    positionIds: values.positionId ? [values.positionId] : [],
                },
                account: values.createAccount
                    ? {
                          role: values.accountRole,
                          temporaryPassword: values.temporaryPassword,
                      }
                    : undefined,
            });
            setClosing(true);
        } catch (error) {
            const message = t(getEmployeeErrorKey(error));

            if (getEmployeeErrorMessage(error).toLowerCase().includes('email')) {
                setError('email', { message, type: 'server' });
                return;
            }

            showToast({
                message,
                title: t('employees.saveError'),
                variant: 'error',
            });
        }
    }

    return createPortal(
        <div className="fixed inset-0 z-50">
            <div
                aria-hidden="true"
                className={`absolute inset-0 bg-[rgba(23,22,15,0.35)] ${
                    closing ? 'drawer-backdrop--closing' : 'drawer-backdrop'
                }`}
                onClick={requestClose}
            />
            <form
                aria-labelledby={titleId}
                aria-modal="true"
                className={`absolute inset-y-0 right-0 flex w-[min(560px,100%)] flex-col bg-paper text-ink shadow-[-12px_0_40px_rgba(23,22,15,0.15)] ${
                    closing ? 'drawer-panel--closing' : 'drawer-panel'
                }`}
                noValidate
                role="dialog"
                onAnimationEnd={(event) => {
                    if (closing && event.target === event.currentTarget) onClose();
                }}
                onSubmit={handleSubmit(handleValidSubmit)}
            >
                <div className="flex items-center justify-between border-b border-rule px-6 py-[22px] max-sm:px-4">
                    <div className="flex flex-col gap-0.5">
                        <h2 className="text-lg font-semibold tracking-[-0.01em]" id={titleId}>
                            {t('employees.add')}
                        </h2>
                        <span className="tabular-nums text-xs text-muted">
                            {t('employees.autoCode')}
                        </span>
                    </div>
                    <button
                        aria-label={t('common.close')}
                        className="grid size-8 min-h-0 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-lg text-muted transition-colors hover:bg-stone"
                        type="button"
                        onClick={requestClose}
                    >
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>

                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pt-2 pb-6 max-sm:px-4">
                    <Section index="01" title={t('employees.sectionBasic')}>
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
                            <label className={warmLabelClass}>
                                {t('employees.lastName')} *
                                <input
                                    aria-invalid={Boolean(errors.lastName)}
                                    className={warmFieldClass}
                                    placeholder={t('employees.lastNamePlaceholder')}
                                    {...register('lastName', {
                                        validate: (value) =>
                                            value.trim() !== '' || t('common.required'),
                                    })}
                                />
                                <FieldError message={errors.lastName?.message} />
                            </label>
                            <label className={warmLabelClass}>
                                {t('employees.firstName')} *
                                <input
                                    aria-invalid={Boolean(errors.firstName)}
                                    className={warmFieldClass}
                                    placeholder={t('employees.firstNamePlaceholder')}
                                    {...register('firstName', {
                                        validate: (value) =>
                                            value.trim() !== '' || t('common.required'),
                                    })}
                                />
                                <FieldError message={errors.firstName?.message} />
                            </label>
                            <label className={warmLabelClass}>
                                {t('employees.gender')}
                                <select className={warmSelectClass} {...register('gender')}>
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
                                    type="date"
                                    {...register('dateOfBirth')}
                                />
                            </label>
                        </div>
                    </Section>

                    <Section index="02" title={t('employees.sectionContact')}>
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
                            <label className={warmLabelClass}>
                                {t('common.email')} *
                                <input
                                    aria-invalid={Boolean(errors.email)}
                                    className={warmFieldClass}
                                    placeholder={t('employees.emailPlaceholder')}
                                    type="email"
                                    {...register('email', {
                                        required: t('common.required'),
                                    })}
                                />
                                <FieldError message={errors.email?.message} />
                            </label>
                            <label className={warmLabelClass}>
                                {t('employees.phoneNumber')}
                                <input
                                    className={warmFieldClass}
                                    placeholder={t('employees.phonePlaceholder')}
                                    {...register('phoneNumber')}
                                />
                            </label>
                        </div>
                    </Section>

                    <Section index="03" title={t('employees.sectionWork')}>
                        <div className="flex flex-col gap-2">
                            <span className="text-[13px] font-medium">
                                {t('common.branches')} *
                            </span>
                            <BranchChips
                                branches={branches}
                                selectedIds={branchIds}
                                onToggle={toggleBranch}
                            />
                            <FieldError
                                message={
                                    branchMissing ? t('employees.branchRequired') : undefined
                                }
                            />
                        </div>
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
                            <label className={warmLabelClass}>
                                {t('common.position')}
                                <select className={warmSelectClass} {...register('positionId')}>
                                    <option value="">{t('employees.selectPosition')}</option>
                                    {positions.map((position) => (
                                        <option key={position.id} value={position.id}>
                                            {position.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className={warmLabelClass}>
                                {t('employees.hireDate')}
                                <input
                                    className={warmFieldClass}
                                    type="date"
                                    {...register('hireDate')}
                                />
                            </label>
                        </div>
                    </Section>

                    <Section index="04" title={t('employees.sectionAccount')}>
                        <div className="flex items-center justify-between gap-4 rounded-[10px] border border-rule px-4 py-3.5">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-medium">
                                    {t('employees.createLoginAccount')}
                                </span>
                                <span className="text-xs text-muted">
                                    {t('employees.createAccountHint')}
                                </span>
                            </div>
                            <button
                                aria-checked={createAccount}
                                aria-label={t('employees.createLoginAccount')}
                                className={`relative h-[22px] w-10 min-h-0 flex-none cursor-pointer rounded-full border-0 p-0 transition-colors duration-200 ${
                                    createAccount ? 'bg-ink' : 'bg-[#cfcabe]'
                                }`}
                                role="switch"
                                type="button"
                                onClick={() =>
                                    setValue('createAccount', !createAccount)
                                }
                            >
                                <span
                                    className={`absolute top-[3px] left-[3px] size-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                                        createAccount ? 'translate-x-[18px]' : ''
                                    }`}
                                />
                            </button>
                        </div>
                        {createAccount && (
                            <div className="rise-enter grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
                                <label className={warmLabelClass}>
                                    {t('employees.accountRole')}
                                    <select
                                        className={warmSelectClass}
                                        {...register('accountRole')}
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
                                    {t('employees.temporaryPassword')} *
                                    <input
                                        aria-invalid={Boolean(errors.temporaryPassword)}
                                        autoComplete="new-password"
                                        className={warmFieldClass}
                                        type="password"
                                        {...register('temporaryPassword', {
                                            shouldUnregister: true,
                                            minLength: {
                                                message: t('employees.passwordMinLength'),
                                                value: 6,
                                            },
                                            required: t('common.required'),
                                        })}
                                    />
                                    <FieldError
                                        message={errors.temporaryPassword?.message}
                                    />
                                </label>
                            </div>
                        )}
                    </Section>
                </div>

                <div className="flex justify-end gap-2 border-t border-rule px-6 py-4 max-sm:px-4">
                    <button
                        className={secondaryButtonClass}
                        disabled={isSubmitting}
                        type="button"
                        onClick={requestClose}
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        className={primaryButtonClass}
                        disabled={isSubmitting}
                        type="submit"
                    >
                        {isSubmitting ? t('common.loadingSave') : t('employees.add')}
                    </button>
                </div>
            </form>
        </div>,
        document.body,
    );
}
