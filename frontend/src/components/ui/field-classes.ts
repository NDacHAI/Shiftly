// Shared form-control styles. Pages and dialogs import these instead of
// redefining their own input class strings.
export const fieldClass =
    'min-h-10 w-full rounded-lg border border-rule-strong bg-white px-3 text-sm font-normal text-ink outline-none transition-colors placeholder:text-faint focus:border-ink disabled:cursor-not-allowed disabled:border-rule disabled:bg-stone-soft disabled:text-muted aria-invalid:border-ember-strong';

export const textAreaFieldClass = `${fieldClass} min-h-24 py-2.5`;
