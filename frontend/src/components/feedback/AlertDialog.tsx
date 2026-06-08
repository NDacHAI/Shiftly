import { Button } from '@/components/ui';
import { DialogShell } from './DialogShell';

type AlertDialogProps = {
    description: string;
    open: boolean;
    title?: string;
    closeLabel?: string;
    onClose: () => void;
};

export function AlertDialog({
    description,
    open,
    title = 'Thông báo',
    closeLabel = 'Đóng',
    onClose,
}: AlertDialogProps) {
    return (
        <DialogShell
            description={description}
            open={open}
            title={title}
            onClose={onClose}
        >
            <div className="mt-6 flex justify-end">
                <Button
                    autoFocus
                    onClick={onClose}
                >
                    {closeLabel}
                </Button>
            </div>
        </DialogShell>
    );
}
