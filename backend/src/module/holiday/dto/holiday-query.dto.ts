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
import { HolidayStatus } from '../entities/holiday-status.enum';

export const holidaySortFields = [
    'name',
    'holidayDate',
    'status',
    'createdAt',
] as const;

export type HolidaySortField = (typeof holidaySortFields)[number];

export class HolidayQueryDto {
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
    @IsInt()
    @Min(1900)
    @Max(2100)
    year?: number;

    @IsOptional()
    @Type(() => Number)
    @IsEnum(HolidayStatus)
    status?: HolidayStatus;

    @IsOptional()
    @IsIn(holidaySortFields)
    sortBy: HolidaySortField = 'holidayDate';

    @IsOptional()
    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string' ? value.toUpperCase() : value,
    )
    @IsIn(['ASC', 'DESC'])
    sortOrder: 'ASC' | 'DESC' = 'DESC';
}
