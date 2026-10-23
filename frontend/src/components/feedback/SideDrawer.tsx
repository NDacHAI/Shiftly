import { type ReactNode, useCallback, useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type SideDrawerProps = {
    busy?: boolean;
    closeLabel: string;
    // Controlled close: switching this to false plays the exit animation, then onClosed.
    open?: boolean;
    subtitle?: ReactNode;
    title: string;
    widthClass?: string;
    // Receives requestClose so the body can play the exit animation after a save.
    children: (requestClose: () => void) => ReactNode;
    onClosed: () => void;
};

// Right-hand panel that slides in, and slides out before onClosed unmounts it.
export function SideDrawer({
    busy = false,
    closeLabel,
    open = true,
    subtitle,
    title,
    widthClass = 'w-[min(520px,100%)]',
    children,
    onClosed,
}: SideDrawerProps) {
    const titleId = useId();
    const [closeRequested, setCloseRequested] = useState(false);
    const closing = closeRequested || !open;
    const requestClose = useCallback(() => {
        if (!busy) setCloseRequested(true);
    }, [busy]);

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') requestClose();
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [requestClose]);

    return createPortal(
        <div className="fixed inset-0 z-50">
            <div
                aria-hidden="true"
                className={`absolute inset-0 bg-[rgba(23,22,15,0.35)] ${
                    closing ? 'drawer-backdrop--closing' : 'drawer-backdrop'
                }`}
                onClick={requestClose}
            />
            <div
                aria-labelledby={titleId}
                aria-modal="true"
                className={`absolute inset-y-0 right-0 flex flex-col bg-paper text-ink shadow-[-12px_0_40px_rgba(23,22,15,0.15)] ${widthClass} ${
                    closing ? 'drawer-panel--closing' : 'drawer-panel'
                }`}
                role="dialog"
                onAnimationEnd={(event) => {
                    if (closing && event.target === event.currentTarget) onClosed();
                }}
            >
                <div className="flex items-center justify-between border-b border-rule px-6 py-[22px] max-sm:px-4">
                    <div className="flex flex-col gap-0.5">
                        <h2 className="text-lg font-semibold tracking-[-0.01em]" id={titleId}>
                            {title}
                        </h2>
                        {subtitle && <span className="text-xs text-muted">{subtitle}</span>}
                    </div>
                    <button
                        aria-label={closeLabel}
                        className="grid size-8 min-h-0 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-lg text-muted transition-colors hover:bg-stone"
                        type="button"
                        onClick={requestClose}
                    >
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>
                {children(requestClose)}
            </div>
        </div>,
        document.body,
    );
}
