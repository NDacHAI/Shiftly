import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type LoadingOverlayProps = {
    label?: string;
    visible: boolean;
};

export function LoadingOverlay({
    label = 'Đang tải...',
    visible,
}: LoadingOverlayProps) {
    if (!visible) {
        return null;
    }

    return (
        <div
            aria-live="polite"
            className="absolute inset-0 z-20 flex items-center justify-center bg-paper/70"
            role="status"
        >
            <div className="flex items-center gap-3 rounded-lg border border-rule bg-paper px-4 py-2.5 text-[13px] font-medium text-ink shadow-[0_8px_24px_rgba(23,22,15,0.1)]">
                <FontAwesomeIcon
                    className="animate-spin text-muted"
                    icon={faSpinner}
                />
                {label}
            </div>
        </div>
    );
}
