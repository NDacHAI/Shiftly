// Shared form-control styles. Pages and dialogs import these instead of
// redefining their own input class strings.
export const fieldClass =
    'min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800 shadow-xs outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-500 focus:ring-3 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500';

export const textAreaFieldClass = `${fieldClass} min-h-24 py-2.5`;
