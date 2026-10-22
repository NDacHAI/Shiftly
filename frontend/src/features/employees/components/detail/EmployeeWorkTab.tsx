import { type UseFormRegister } from 'react-hook-form';
import { type Branch } from '@/features/branches/types';
import { type Position } from '@/features/positions/types';
import { useI18n } from '@/i18n';
import {
    fieldGridClass,
    formatTenure,
    warmFieldClass,
    warmLabelClass,
    warmSelectClass,
} from '../../lib/employee-ui';
import { BranchChips } from '../BranchChips';
import { DetailSection } from './DetailSection';
import { type EmployeeDetailFormValues } from './employee-detail-tabs';

type EmployeeWorkTabProps = {
    branches: Branch[];
    branchIds: string[];
    disabled: boolean;
    hireDate: string;
    positions: Position[];
    register: UseFormRegister<EmployeeDetailFormValues>;
    onToggleBranch: (branchId: string) => void;
};

export function EmployeeWorkTab({
    branches,
    branchIds,
    disabled,
    hireDate,
    positions,
    register,
    onToggleBranch,
}: EmployeeWorkTabProps) {
    const { t } = useI18n();

    return (
        <DetailSection hint={t('employees.workHint')} title={t('employees.workSection')}>
            <div className="flex flex-col gap-2">
                <span className="text-[13px] font-medium">{t('common.branches')}</span>
                <BranchChips
                    branches={branches}
                    disabled={disabled}
                    selectedIds={branchIds}
                    onToggle={onToggleBranch}
                />
            </div>
            <div className={fieldGridClass}>
                <label className={warmLabelClass}>
                    {t('common.position')}
                    <select
                        className={warmSelectClass}
                        disabled={disabled}
                        {...register('positionId')}
                    >
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
                        disabled={disabled}
                        type="date"
                        {...register('hireDate')}
                    />
                </label>
                <label className={warmLabelClass}>
                    {t('employees.tenure')}
                    <input
                        className={warmFieldClass}
                        disabled
                        value={formatTenure(hireDate, t)}
                    />
                </label>
            </div>
        </DetailSection>
    );
}
