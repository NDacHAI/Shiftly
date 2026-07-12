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
import { RewardPenaltyCategory } from '../entities/reward-penalty-category.enum';
import { RewardPenaltyStatus } from '../entities/reward-penalty-status.enum';

export const rewardPenaltyCatalogSortFields = [
    'code',
    'name',
    'category',
    'amount',
    'status',
    'createdAt',
] as const;

export type RewardPenaltyCatalogSortField =
    (typeof rewardPenaltyCatalogSortFields)[number];

export class RewardPenaltyCatalogQueryDto {
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
    @IsEnum(RewardPenaltyCategory)
    category?: RewardPenaltyCategory;

    @IsOptional()
    @Type(() => Number)
    @IsEnum(RewardPenaltyStatus)
    status?: RewardPenaltyStatus;

    @IsOptional()
    @IsIn(rewardPenaltyCatalogSortFields)
    sortBy: RewardPenaltyCatalogSortField = 'createdAt';

    @IsOptional()
    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string' ? value.toUpperCase() : value,
    )
    @IsIn(['ASC', 'DESC'])
    sortOrder: 'ASC' | 'DESC' = 'DESC';
}
