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
import { LeaveRequestMode } from '../entities/leave-request-mode.enum';
import { LeaveRequestStatus } from '../entities/leave-request-status.enum';

export const leaveRequestSortFields = [
    'startDate',
    'createdAt',
    'updatedAt',
    'status',
] as const;

export type LeaveRequestSortField = (typeof leaveRequestSortFields)[number];

export class LeaveRequestQueryDto {
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
    @IsEnum(LeaveRequestStatus)
    status?: LeaveRequestStatus;

    @IsOptional()
    @IsEnum(LeaveRequestMode)
    requestMode?: LeaveRequestMode;

    @IsOptional()
    @IsUUID()
    branchId?: string;

    @IsOptional()
    @IsUUID()
    employeeId?: string;

    @IsOptional()
    @IsDateString()
    fromDate?: string;

    @IsOptional()
    @IsDateString()
    toDate?: string;

    @IsOptional()
    @IsIn(leaveRequestSortFields)
    sortBy: LeaveRequestSortField = 'createdAt';

    @IsOptional()
    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string' ? value.toUpperCase() : value,
    )
    @IsIn(['ASC', 'DESC'])
    sortOrder: 'ASC' | 'DESC' = 'DESC';
}
