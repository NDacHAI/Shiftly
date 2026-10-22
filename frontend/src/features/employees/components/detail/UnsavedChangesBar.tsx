import { useI18n } from '@/i18n';

type UnsavedChangesBarProps = {
    message: string;
    saving: boolean;
    onDiscard: () => void;
    onSave: () => void;
};

// Floating bar that rises from the bottom while the profile has unsaved edits.
export function UnsavedChangesBar({
    message,
    saving,
    onDiscard,
    onSave,
}: UnsavedChangesBarProps) {
    const { t } = useI18n();

    return (
        <div
            className="dock-enter fixed bottom-6 left-1/2 z-40 flex w-[min(720px,calc(100%-32px))] -translate-x-1/2 items-center gap-3 rounded-xl bg-ink py-2.5 pr-2.5 pl-[18px] text-sand shadow-[0_12px_32px_rgba(23,22,15,0.25)]"
            role="status"
        >
            <span className="min-w-0 flex-1 truncate text-[13px]">{message}</span>
            <button
                className="h-9 min-h-0 cursor-pointer rounded-lg border border-ink-line bg-transparent px-3.5 text-[13px] font-medium whitespace-nowrap text-sand transition-colors hover:bg-[#26251d] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={saving}
                type="button"
                onClick={onDiscard}
            >
                {t('employees.discardChanges')}
            </button>
            <button
                className="h-9 min-h-0 cursor-pointer rounded-lg border-0 bg-ember px-3.5 text-[13px] font-semibold whitespace-nowrap text-ink transition-colors hover:bg-[#ea7d43] disabled:cursor-wait disabled:opacity-70"
                disabled={saving}
                type="button"
                onClick={onSave}
            >
                {saving ? t('common.loadingSave') : t('common.save')}
            </button>
        </div>
    );
}
