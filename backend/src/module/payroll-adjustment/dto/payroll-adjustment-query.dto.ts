import { Transform, Type } from 'class-transformer';
import {
    IsEnum,
    IsIn,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    Min,
} from 'class-validator';
import { RewardPenaltyCategory } from '@/module/reward-penalty-catalog/entities/reward-penalty-category.enum';

export const payrollAdjustmentSortFields = [
    'adjustmentDate',
    'amount',
    'category',
    'createdAt',
] as const;

export type PayrollAdjustmentSortField =
    (typeof payrollAdjustmentSortFields)[number];

export class PayrollAdjustmentQueryDto {
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
    @IsUUID()
    payrollPeriodId?: string;

    @IsOptional()
    @IsUUID()
    employeeId?: string;

    @IsOptional()
    @IsUUID()
    branchId?: string;

    @IsOptional()
    @Type(() => Number)
    @IsEnum(RewardPenaltyCategory)
    category?: RewardPenaltyCategory;

    @IsOptional()
    @IsIn(payrollAdjustmentSortFields)
    sortBy: PayrollAdjustmentSortField = 'createdAt';

    @IsOptional()
    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string' ? value.toUpperCase() : value,
    )
    @IsIn(['ASC', 'DESC'])
    sortOrder: 'ASC' | 'DESC' = 'DESC';
}
