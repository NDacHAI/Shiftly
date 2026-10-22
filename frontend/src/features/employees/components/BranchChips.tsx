import { faCheck, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { type Branch } from '@/features/branches/types';

type BranchChipsProps = {
    branches: Branch[];
    disabled?: boolean;
    selectedIds: string[];
    onToggle: (branchId: string) => void;
};

// Toggle chips for picking branches; selected chips turn solid ink.
export function BranchChips({
    branches,
    disabled = false,
    selectedIds,
    onToggle,
}: BranchChipsProps) {
    return (
        <div className="flex flex-wrap gap-2">
            {branches.map((branch) => {
                const selected = selectedIds.includes(branch.id);

                return (
                    <button
                        aria-pressed={selected}
                        className={`flex h-[34px] min-h-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-[background-color,color,border-color] duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 ${
                            selected
                                ? 'border-ink bg-ink text-sand'
                                : 'border-rule-strong bg-transparent text-ink hover:bg-stone-soft'
                        } ${disabled ? '' : 'cursor-pointer'}`}
                        disabled={disabled}
                        key={branch.id}
                        type="button"
                        onClick={() => onToggle(branch.id)}
                    >
                        <FontAwesomeIcon
                            className="text-[11px]"
                            icon={selected ? faCheck : faPlus}
                        />
                        {branch.name}
                    </button>
                );
            })}
        </div>
    );
}
