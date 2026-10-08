type ChartTooltipRow = {
    color: string;
    label: string;
    value: string;
};

type ChartTooltipProps = {
    title: string;
    rows: ChartTooltipRow[];
    footer?: Array<Omit<ChartTooltipRow, 'color'>>;
};

export function ChartTooltip({ title, rows, footer = [] }: ChartTooltipProps) {
    return (
        <div className="min-w-44 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
            <p className="mb-1.5 font-semibold text-slate-900">{title}</p>
            <ul className="grid gap-1">
                {rows.map((row) => (
                    <li className="flex items-center gap-2" key={row.label}>
                        <span
                            aria-hidden="true"
                            className="h-0.5 w-3 shrink-0 rounded-full"
                            style={{ backgroundColor: row.color }}
                        />
                        <span className="flex-1 text-slate-500">{row.label}</span>
                        <strong className="text-slate-900 tabular-nums">
                            {row.value}
                        </strong>
                    </li>
                ))}
            </ul>
            {footer.length > 0 && (
                <ul className="mt-1.5 grid gap-1 border-t border-slate-100 pt-1.5">
                    {footer.map((row) => (
                        <li className="flex items-center gap-2" key={row.label}>
                            <span className="flex-1 text-slate-500">
                                {row.label}
                            </span>
                            <strong className="text-slate-900 tabular-nums">
                                {row.value}
                            </strong>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
