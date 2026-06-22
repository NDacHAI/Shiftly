import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { type IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { EmptyState } from '@/components/ui';
import { useI18n } from '@/i18n';

type EmployeeComingSoonTabProps = {
    icon: IconDefinition;
    title: string;
};

export function EmployeeComingSoonTab({
    icon,
    title,
}: EmployeeComingSoonTabProps) {
    const { t } = useI18n();

    return (
        <EmptyState
            description={t('employees.tabComingSoon')}
            icon={<FontAwesomeIcon icon={icon} />}
            title={title}
        />
    );
}
