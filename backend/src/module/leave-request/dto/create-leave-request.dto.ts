import { Transform } from 'class-transformer';
import {
    ArrayNotEmpty,
    IsArray,
    IsBoolean,
    IsDateString,
    IsEnum,
    IsOptional,
    IsString,
    IsUUID,
    Matches,
    MaxLength,
    ValidateIf,
} from 'class-validator';
import { LeaveRequestMode } from '../entities/leave-request-mode.enum';

export class CreateLeaveRequestDto {
    @IsOptional()
    @IsUUID()
    employeeId?: string;

    @IsUUID()
    branchId!: string;

    @IsEnum(LeaveRequestMode)
    requestMode!: LeaveRequestMode;

    @ValidateIf((payload: CreateLeaveRequestDto) =>
        payload.requestMode === LeaveRequestMode.DateTime,
    )
    @IsDateString()
    startDate?: string;

    @ValidateIf((payload: CreateLeaveRequestDto) =>
        payload.requestMode === LeaveRequestMode.DateTime,
    )
    @IsDateString()
    endDate?: string;

    @ValidateIf((payload: CreateLeaveRequestDto) =>
        payload.requestMode === LeaveRequestMode.DateTime,
    )
    @IsBoolean()
    isFullDay?: boolean;

    @ValidateIf((payload: CreateLeaveRequestDto) =>
        payload.requestMode === LeaveRequestMode.DateTime &&
        payload.isFullDay === false,
    )
    @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    startTime?: string;

    @ValidateIf((payload: CreateLeaveRequestDto) =>
        payload.requestMode === LeaveRequestMode.DateTime &&
        payload.isFullDay === false,
    )
    @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    endTime?: string;

    @ValidateIf((payload: CreateLeaveRequestDto) =>
        payload.requestMode === LeaveRequestMode.Shift,
    )
    @IsArray()
    @ArrayNotEmpty()
    @IsUUID('4', { each: true })
    workScheduleIds?: string[];

    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    @IsString()
    @MaxLength(1000)
    reason!: string;
}
