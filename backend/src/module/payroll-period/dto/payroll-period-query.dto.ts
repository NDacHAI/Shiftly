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
import { PayrollPeriodStatus } from '../entities/payroll-period-status.enum';

export const payrollPeriodSortFields = [
    'code',
    'name',
    'payrollMonth',
    'payrollYear',
    'startDate',
    'endDate',
    'status',
    'createdAt',
] as const;

export type PayrollPeriodSortField =
    (typeof payrollPeriodSortFields)[number];

export class PayrollPeriodQueryDto {
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
    @IsEnum(PayrollPeriodStatus)
    status?: PayrollPeriodStatus;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(12)
    payrollMonth?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(2000)
    @Max(2100)
    payrollYear?: number;

    @IsOptional()
    @IsIn(payrollPeriodSortFields)
    sortBy: PayrollPeriodSortField = 'createdAt';

    @IsOptional()
    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string' ? value.toUpperCase() : value,
    )
    @IsIn(['ASC', 'DESC'])
    sortOrder: 'ASC' | 'DESC' = 'DESC';
}
