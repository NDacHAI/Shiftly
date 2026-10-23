import { type ReactNode, useState } from 'react';
import { SideDrawer } from './SideDrawer';

// Layout pieces shared by every right-hand drawer, following
// features/employees/components/EmployeeAddDrawer.tsx.

export function DrawerBody({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto px-6 py-6 max-sm:px-4">
            {children}
        </div>
    );
}

export function DrawerFooter({ children }: { children: ReactNode }) {
    return (
        <div className="flex justify-end gap-2 border-t border-rule px-6 py-4 max-sm:px-4">
            {children}
        </div>
    );
}

export function DrawerSection({
    children,
    index,
    title,
}: {
    children: ReactNode;
    index?: string;
    title: string;
}) {
    return (
        <div className="flex flex-col gap-3.5 border-b border-rule-soft pb-[18px] last:border-b-0 last:pb-0">
            <span className="tabular-nums text-[11px] tracking-[0.06em] text-muted uppercase">
                {index ? `${index} · ${title}` : title}
            </span>
            {children}
        </div>
    );
}

type DrawerDetailsProps = {
    items: ReadonlyArray<ReadonlyArray<ReactNode>>;
};

// Label / value rows for read-only drawers.
export function DrawerDetails({ items }: DrawerDetailsProps) {
    return (
        <dl className="flex flex-col">
            {items.map(([label, value], index) => (
                <div
                    className="grid grid-cols-[minmax(120px,38%)_1fr] gap-4 border-b border-rule-soft py-3.5 last:border-b-0 max-sm:grid-cols-1 max-sm:gap-1"
                    key={index}
                >
                    <dt className="text-[13px] text-muted">{label}</dt>
                    <dd className="m-0 min-w-0 text-sm break-words text-ink">{value}</dd>
                </div>
            ))}
        </dl>
    );
}

type DrawerShellProps = {
    busy?: boolean;
    children: ReactNode;
    closeLabel: string;
    description?: ReactNode;
    open: boolean;
    title: string;
    widthClass?: string;
    onClose: () => void;
};

// Drawer driven by an `open` flag (drop-in for DialogShell). It stays mounted
// with its last content while the exit animation plays.
export function DrawerShell({
    busy,
    children,
    closeLabel,
    description,
    open,
    title,
    widthClass,
    onClose,
}: DrawerShellProps) {
    const [mounted, setMounted] = useState(open);
    const [lastChildren, setLastChildren] = useState(children);
    const [lastTitle, setLastTitle] = useState(title);

    if (open && !mounted) setMounted(true);
    if (open && lastChildren !== children) setLastChildren(children);
    if (open && lastTitle !== title) setLastTitle(title);

    if (!mounted) return null;

    return (
        <SideDrawer
            busy={busy}
            closeLabel={closeLabel}
            open={open}
            subtitle={description}
            title={open ? title : lastTitle}
            widthClass={widthClass}
            onClosed={() => {
                setMounted(false);
                if (open) onClose();
            }}
        >
            {() => (open ? children : lastChildren)}
        </SideDrawer>
    );
}
