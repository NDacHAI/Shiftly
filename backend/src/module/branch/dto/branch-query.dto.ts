import { Transform, Type } from 'class-transformer';
import {
    IsIn,
    IsInt,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';

export const branchSortFields = [
    'code',
    'name',
    'status',
    'createdAt',
] as const;

export type BranchSortField = (typeof branchSortFields)[number];

export class BranchQueryDto {
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
    @IsIn(branchSortFields)
    sortBy: BranchSortField = 'createdAt';

    @IsOptional()
    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string' ? value.toUpperCase() : value,
    )
    @IsIn(['ASC', 'DESC'])
    sortOrder: 'ASC' | 'DESC' = 'DESC';
}
