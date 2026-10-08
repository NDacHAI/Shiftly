type ChartLegendProps = {
    items: Array<{ key: string; label: string; color: string }>;
};

// Legend text stays in neutral ink; only the swatch carries the series color.
export function ChartLegend({ items }: ChartLegendProps) {
    return (
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-2 text-xs text-slate-600">
            {items.map((item) => (
                <li className="flex items-center gap-1.5" key={item.key}>
                    <span
                        aria-hidden="true"
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                    />
                    {item.label}
                </li>
            ))}
        </ul>
    );
}
