import { Type } from 'class-transformer';
import {
    IsEnum,
    IsIn,
    IsInt,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';
import { PayrollProcessingStatus } from '../entities/payroll-processing-status.enum';

const payrollProcessingSortFields = [
    'createdAt',
    'generatedAt',
    'status',
    'totalEmployees',
    'processedEmployees',
    'successCount',
    'failedCount',
] as const;

export type PayrollProcessingSortField =
    (typeof payrollProcessingSortFields)[number];

export class PayrollProcessingQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit = 10;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsEnum(PayrollProcessingStatus)
    status?: PayrollProcessingStatus;

    @IsOptional()
    @IsString()
    payrollPeriodId?: string;

    @IsOptional()
    @IsIn(payrollProcessingSortFields)
    sortBy: PayrollProcessingSortField = 'createdAt';

    @IsOptional()
    @IsIn(['ASC', 'DESC'])
    sortOrder: 'ASC' | 'DESC' = 'DESC';
}
