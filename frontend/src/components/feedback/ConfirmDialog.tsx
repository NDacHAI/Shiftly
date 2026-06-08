import { Button } from '@/components/ui';
import { DialogShell } from './DialogShell';

type ConfirmDialogProps = {
    description: string;
    open: boolean;
    title?: string;
    cancelLabel?: string;
    confirmLabel?: string;
    loading?: boolean;
    tone?: 'danger' | 'primary';
    onCancel: () => void;
    onConfirm: () => void;
};

export function ConfirmDialog({
    description,
    open,
    title = 'Xác nhận',
    cancelLabel = 'Hủy',
    confirmLabel = 'Xác nhận',
    loading = false,
    tone = 'primary',
    onCancel,
    onConfirm,
}: ConfirmDialogProps) {
    function handleClose() {
        if (!loading) {
            onCancel();
        }
    }

    return (
        <DialogShell
            description={description}
            open={open}
            title={title}
            onClose={handleClose}
        >
            <div className="mt-6 flex justify-end gap-3">
                <Button
                    disabled={loading}
                    onClick={onCancel}
                    variant="secondary"
                >
                    {cancelLabel}
                </Button>
                <Button
                    autoFocus
                    loading={loading}
                    loadingLabel="Đang xử lý..."
                    onClick={onConfirm}
                    variant={tone === 'danger' ? 'danger' : 'primary'}
                >
                    {confirmLabel}
                </Button>
            </div>
        </DialogShell>
    );
}
