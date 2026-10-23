import { type ReactNode, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';

type DialogShellProps = {
    children: ReactNode;
    description: string;
    open: boolean;
    panelClassName?: string;
    title: string;
    onClose: () => void;
};

export function DialogShell({
    children,
    description,
    open,
    panelClassName = '',
    title,
    onClose,
}: DialogShellProps) {
    const titleId = useId();
    const descriptionId = useId();

    useEffect(() => {
        if (!open) {
            return;
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                onClose();
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, open]);

    if (!open) {
        return null;
    }

    return createPortal(
        <div
            className="dialog-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[rgba(23,22,15,0.35)] p-5"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                aria-describedby={descriptionId}
                aria-labelledby={titleId}
                aria-modal="true"
                className={`dialog-panel w-full max-w-md rounded-[14px] border border-rule bg-paper p-6 text-ink shadow-[0_24px_60px_rgba(23,22,15,0.18)] ${panelClassName}`}
                role="dialog"
            >
                <h2
                    className="text-lg font-semibold tracking-[-0.01em]"
                    id={titleId}
                >
                    {title}
                </h2>
                <p
                    className="mt-2 text-sm leading-6 text-muted"
                    id={descriptionId}
                >
                    {description}
                </p>
                {children}
            </div>
        </div>,
        document.body,
    );
}
