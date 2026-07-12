import { Type } from 'class-transformer';
import {
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
} from 'class-validator';
import { RewardPenaltyCategory } from '../entities/reward-penalty-category.enum';
import { RewardPenaltyStatus } from '../entities/reward-penalty-status.enum';

export class UpdateRewardPenaltyCatalogDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name?: string;

    @IsOptional()
    @Type(() => Number)
    @IsEnum(RewardPenaltyCategory)
    category?: RewardPenaltyCategory;

    @IsOptional()
    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0.01)
    @Max(9999999999.99)
    amount?: number;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?: string | null;

    @IsOptional()
    @Type(() => Number)
    @IsEnum(RewardPenaltyStatus)
    status?: RewardPenaltyStatus;
}
