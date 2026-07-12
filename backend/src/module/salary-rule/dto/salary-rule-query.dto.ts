import { Transform, Type } from 'class-transformer';
import {
    IsEnum,
    IsIn,
    IsInt,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';
import { SalaryRuleStatus } from '../entities/salary-rule-status.enum';

export const salaryRuleSortFields = [
    'code',
    'name',
    'status',
    'createdAt',
] as const;

export type SalaryRuleSortField = (typeof salaryRuleSortFields)[number];

export class SalaryRuleQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit = 10;

    @IsOptional()
    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    @IsString()
    search?: string;

    @IsOptional()
    @Type(() => Number)
    @IsEnum(SalaryRuleStatus)
    status?: SalaryRuleStatus;

    @IsOptional()
    @IsIn(salaryRuleSortFields)
    sortBy: SalaryRuleSortField = 'createdAt';

    @IsOptional()
    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string' ? value.toUpperCase() : value,
    )
    @IsIn(['ASC', 'DESC'])
    sortOrder: 'ASC' | 'DESC' = 'DESC';
}
