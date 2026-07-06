import { Transform } from 'class-transformer';
import {
    IsDateString,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
} from 'class-validator';

export class CreateWorkScheduleDto {
    @IsUUID()
    employeeId!: string;

    @IsUUID()
    branchId!: string;

    @IsUUID()
    positionId!: string;

    @IsUUID()
    workShiftId!: string;

    @IsDateString()
    workDate!: string;

    @IsOptional()
    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    @IsString()
    @MaxLength(1000)
    note?: string;
}
