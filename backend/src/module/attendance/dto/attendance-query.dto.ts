import { Transform, Type } from 'class-transformer';
import {
    IsBoolean,
    IsDateString,
    IsEnum,
    IsIn,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    Min,
} from 'class-validator';
import { AttendanceStatus } from '../entities/attendance-status.enum';

export const attendanceSortFields = [
    'scheduleDate',
    'scheduledStartAt',
    'createdAt',
    'status',
] as const;

export type AttendanceSortField = (typeof attendanceSortFields)[number];

export class AttendanceQueryDto {
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
    @IsDateString()
    fromDate?: string;

    @IsOptional()
    @IsDateString()
    toDate?: string;

    @IsOptional()
    @IsUUID()
    branchId?: string;

    @IsOptional()
    @IsUUID()
    positionId?: string;

    @IsOptional()
    @IsUUID()
    employeeId?: string;

    @IsOptional()
    @IsUUID()
    workShiftId?: string;

    @IsOptional()
    @IsEnum(AttendanceStatus)
    status?: AttendanceStatus;

    @IsOptional()
    @Transform(({ value }: { value: unknown }) => {
        if (value === 'true' || value === true) {
            return true;
        }

        if (value === 'false' || value === false) {
            return false;
        }

        return value;
    })
    @IsBoolean()
    isLate?: boolean;

    @IsOptional()
    @Transform(({ value }: { value: unknown }) => {
        if (value === 'true' || value === true) {
            return true;
        }

        if (value === 'false' || value === false) {
            return false;
        }

        return value;
    })
    @IsBoolean()
    isEarlyLeave?: boolean;

    @IsOptional()
    @Transform(({ value }: { value: unknown }) => {
        if (value === 'true' || value === true) {
            return true;
        }

        if (value === 'false' || value === false) {
            return false;
        }

        return value;
    })
    @IsBoolean()
    isOvertime?: boolean;

    @IsOptional()
    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    @IsString()
    search?: string;

    @IsOptional()
    @IsIn(attendanceSortFields)
    sortBy: AttendanceSortField = 'scheduleDate';

    @IsOptional()
    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string' ? value.toUpperCase() : value,
    )
    @IsIn(['ASC', 'DESC'])
    sortOrder: 'ASC' | 'DESC' = 'DESC';
}
