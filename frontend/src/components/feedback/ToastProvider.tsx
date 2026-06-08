import {
    type ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCircleCheck,
    faCircleExclamation,
    faCircleInfo,
    faTriangleExclamation,
    faXmark,
} from '@fortawesome/free-solid-svg-icons';
import {
    ToastContext,
    type ToastOptions,
    type ToastVariant,
} from './toast-context';
import { apiErrorEvent } from '@/stores/auth.store';

type ToastProviderProps = {
    children: ReactNode;
};

type ToastItem = Required<Pick<ToastOptions, 'message' | 'variant'>> &
    Pick<ToastOptions, 'title'> & {
        exiting: boolean;
        id: number;
    };

const toastExitDuration = 220;

const toastStyles: Record<
    ToastVariant,
    { containerClass: string; icon: typeof faCircleCheck; textClass: string }
> = {
    success: {
        containerClass: 'border-emerald-200 bg-emerald-50',
        icon: faCircleCheck,
        textClass: 'text-emerald-600',
    },
    error: {
        containerClass: 'border-red-200 bg-red-50',
        icon: faCircleExclamation,
        textClass: 'text-red-600',
    },
    info: {
        containerClass: 'border-blue-200 bg-blue-50',
        icon: faCircleInfo,
        textClass: 'text-blue-600',
    },
    warning: {
        containerClass: 'border-amber-200 bg-amber-50',
        icon: faTriangleExclamation,
        textClass: 'text-amber-500',
    },
};

export function ToastProvider({ children }: ToastProviderProps) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const nextId = useRef(0);
    const closingToastIds = useRef(new Set<number>());
    const exitTimers = useRef(new Map<number, number>());

    const dismissToast = useCallback((id: number) => {
        if (closingToastIds.current.has(id)) {
            return;
        }

        closingToastIds.current.add(id);
        setToasts((current) =>
            current.map((toast) =>
                toast.id === id ? { ...toast, exiting: true } : toast,
            ),
        );

        const timerId = window.setTimeout(() => {
            setToasts((current) =>
                current.filter((toast) => toast.id !== id),
            );
            closingToastIds.current.delete(id);
            exitTimers.current.delete(id);
        }, toastExitDuration);

        exitTimers.current.set(id, timerId);
    }, []);

    useEffect(
        () => () => {
            exitTimers.current.forEach((timerId) =>
                window.clearTimeout(timerId),
            );
        },
        [],
    );

    const showToast = useCallback(
        ({
            duration = 3500,
            message,
            title,
            variant = 'info',
        }: ToastOptions) => {
            const id = nextId.current++;
            setToasts((current) => [
                ...current,
                { exiting: false, id, message, title, variant },
            ]);

            window.setTimeout(() => dismissToast(id), duration);
        },
        [dismissToast],
    );

    const contextValue = useMemo(() => ({ showToast }), [showToast]);

    useEffect(() => {
        function handleApiError(event: Event) {
            const { message } = (event as CustomEvent<{ message: string }>)
                .detail;
            showToast({
                message,
                title: 'Không thể xử lý yêu cầu',
                variant: 'error',
            });
        }

        window.addEventListener(apiErrorEvent, handleApiError);
        return () => window.removeEventListener(apiErrorEvent, handleApiError);
    }, [showToast]);

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            <div
                aria-label="Thông báo"
                className="pointer-events-none fixed top-5 right-5 z-[60] grid w-[min(380px,calc(100vw-40px))] gap-3"
                role="region"
            >
                {toasts.map((toast) => {
                    const style = toastStyles[toast.variant];

                    return (
                        <div
                            className={`${toast.exiting ? 'toast-exit pointer-events-none' : 'toast-enter'} pointer-events-auto flex items-center gap-3 rounded-xl border p-4 shadow-xl ${style.containerClass}`}
                            key={toast.id}
                            role={toast.variant === 'error' ? 'alert' : 'status'}
                        >
                            <FontAwesomeIcon
                                className={`shrink-0 text-lg ${style.textClass}`}
                                icon={style.icon}
                            />
                            <div className="min-w-0 flex-1">
                                {toast.title && (
                                    <p
                                        className={`text-sm font-bold ${style.textClass}`}
                                    >
                                        {toast.title}
                                    </p>
                                )}
                                <p
                                    className={`text-sm leading-5 ${style.textClass}`}
                                >
                                    {toast.message}
                                </p>
                            </div>
                            <button
                                aria-label="Đóng thông báo"
                                className={`flex size-7 min-h-0 shrink-0 cursor-pointer items-center justify-center rounded-md bg-transparent p-0 transition hover:bg-white/60 ${style.textClass}`}
                                onClick={() => dismissToast(toast.id)}
                                type="button"
                            >
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}
