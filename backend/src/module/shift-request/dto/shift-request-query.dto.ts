import { Transform, Type } from 'class-transformer';
import {
    IsDateString,
    IsEnum,
    IsIn,
    IsInt,
    IsOptional,
    IsUUID,
    Max,
    Min,
} from 'class-validator';
import { ShiftRequestStatus } from '../entities/shift-request-status.enum';

export const shiftRequestSortFields = [
    'workDate',
    'createdAt',
    'updatedAt',
    'status',
] as const;

export type ShiftRequestSortField = (typeof shiftRequestSortFields)[number];

export class ShiftRequestQueryDto {
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
    @Type(() => Number)
    @IsEnum(ShiftRequestStatus)
    status?: ShiftRequestStatus;

    @IsOptional()
    @IsUUID()
    branchId?: string;

    @IsOptional()
    @IsUUID()
    employeeId?: string;

    @IsOptional()
    @IsUUID()
    positionId?: string;

    @IsOptional()
    @IsUUID()
    workShiftId?: string;

    @IsOptional()
    @IsDateString()
    workDate?: string;

    @IsOptional()
    @IsDateString()
    fromDate?: string;

    @IsOptional()
    @IsDateString()
    toDate?: string;

    @IsOptional()
    @IsIn(shiftRequestSortFields)
    sortBy: ShiftRequestSortField = 'workDate';

    @IsOptional()
    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string' ? value.toUpperCase() : value,
    )
    @IsIn(['ASC', 'DESC'])
    sortOrder: 'ASC' | 'DESC' = 'DESC';
}
