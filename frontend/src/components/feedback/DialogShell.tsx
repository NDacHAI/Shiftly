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
            className="dialog-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-5"
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
                className={`dialog-panel w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ${panelClassName}`}
                role="dialog"
            >
                <h2
                    className="text-lg font-bold text-slate-950"
                    id={titleId}
                >
                    {title}
                </h2>
                <p
                    className="mt-2 text-sm leading-6 text-slate-600"
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
