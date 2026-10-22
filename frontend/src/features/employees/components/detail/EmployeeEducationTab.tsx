import { useI18n } from '@/i18n';
import { DetailSection } from './DetailSection';

export function EmployeeEducationTab() {
    const { t } = useI18n();

    return (
        <DetailSection hint={t('employees.educationHint')} title={t('employees.education')}>
            <div className="rounded-xl border border-dashed border-[#cfcabe] p-7 text-[13px] text-muted">
                {t('employees.tabComingSoon')}
            </div>
        </DetailSection>
    );
}
