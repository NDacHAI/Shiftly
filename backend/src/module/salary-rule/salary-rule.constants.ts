export const defaultSalaryRuleCodes = [
    'NORMAL',
    'OVERTIME',
    'HOLIDAY',
    'HOLIDAY_OVERTIME',
] as const;

export type DefaultSalaryRuleCode = (typeof defaultSalaryRuleCodes)[number];

export const defaultSalaryRules: Array<{
    code: DefaultSalaryRuleCode;
    name: string;
    multiplier: string;
}> = [
    {
        code: 'NORMAL',
        name: 'Lương giờ làm bình thường',
        multiplier: '1.00',
    },
    {
        code: 'OVERTIME',
        name: 'Lương giờ tăng ca',
        multiplier: '1.50',
    },
    {
        code: 'HOLIDAY',
        name: 'Lương giờ làm ngày lễ',
        multiplier: '3.00',
    },
    {
        code: 'HOLIDAY_OVERTIME',
        name: 'Lương tăng ca ngày lễ',
        multiplier: '3.50',
    },
];

export function isDefaultSalaryRuleCode(code: string): boolean {
    return defaultSalaryRuleCodes.includes(code as DefaultSalaryRuleCode);
}
