// Validated data-viz palette: categorical slots are used in fixed order,
// status colors are reserved for attendance states and always ship with a label.
// ink/accent follow the warm dashboard theme in global.css.
export const chartColors = {
    series1: '#2a78d6',
    series2: '#eb6834',
    series3: '#1baf7a',
    series4: '#eda100',
    good: '#0ca30c',
    warning: '#fab219',
    critical: '#d03b3b',
    neutral: '#c3c2b7',
    ink: '#17160f',
    inkMuted: '#6b675c',
    accent: '#e06a2c',
    grid: '#e3dfd6',
    axis: '#8a8577',
    surface: '#fbfaf7',
} as const;
