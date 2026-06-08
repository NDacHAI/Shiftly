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
            className="absolute inset-0 z-20 flex items-center justify-center bg-white/75 backdrop-blur-[1px]"
            role="status"
        >
            <div className="flex items-center gap-3 rounded-xl border border-primary-100 bg-white px-5 py-3 text-sm font-semibold text-primary-700 shadow-lg">
                <FontAwesomeIcon
                    className="animate-spin text-primary-600"
                    icon={faSpinner}
                />
                {label}
            </div>
        </div>
    );
}
