import { Transform, Type } from 'class-transformer';
import {
    ArrayNotEmpty,
    IsArray,
    IsDateString,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    MaxLength,
    Min,
} from 'class-validator';

export enum WorkScheduleConflictStrategy {
    SKIP = 'SKIP',
    REPLACE = 'REPLACE',
}

export class BulkCreateWorkSchedulesDto {
    @IsArray()
    @ArrayNotEmpty()
    @IsUUID('4', { each: true })
    employeeIds!: string[];

    @IsUUID()
    branchId!: string;

    @IsUUID()
    positionId!: string;

    @IsUUID()
    workShiftId!: string;

    @IsDateString()
    startDate!: string;

    @IsDateString()
    endDate!: string;

    @IsOptional()
    @IsArray()
    @Type(() => Number)
    @IsInt({ each: true })
    @Min(1, { each: true })
    @Max(7, { each: true })
    weekdays?: number[];

    @IsEnum(WorkScheduleConflictStrategy)
    conflictStrategy!: WorkScheduleConflictStrategy;

    @IsOptional()
    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    @IsString()
    @MaxLength(1000)
    note?: string;
}
