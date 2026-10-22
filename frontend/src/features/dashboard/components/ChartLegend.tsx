type ChartLegendProps = {
    items: Array<{ key: string; label: string; color: string }>;
};

// Legend text stays in neutral ink; only the swatch carries the series color.
export function ChartLegend({ items }: ChartLegendProps) {
    return (
        <ul className="flex flex-wrap gap-x-[18px] gap-y-1 pt-3 pl-5 text-xs text-muted">
            {items.map((item) => (
                <li className="flex items-center gap-1.5" key={item.key}>
                    <span
                        aria-hidden="true"
                        className="size-2.5 rounded-[3px]"
                        style={{ backgroundColor: item.color }}
                    />
                    {item.label}
                </li>
            ))}
        </ul>
    );
}
