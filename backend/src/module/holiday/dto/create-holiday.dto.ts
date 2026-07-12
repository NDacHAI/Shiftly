import { Type } from 'class-transformer';
import {
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    Matches,
    MaxLength,
} from 'class-validator';
import { HolidayStatus } from '../entities/holiday-status.enum';

export class CreateHolidayDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name!: string;

    @IsString()
    @Matches(/^\d{4}-\d{2}-\d{2}$/)
    holidayDate!: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?: string;

    @IsOptional()
    @Type(() => Number)
    @IsEnum(HolidayStatus)
    status?: HolidayStatus;
}
