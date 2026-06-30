import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
    Min,
} from 'class-validator';

export class CreatePositionDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    code!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name!: string;

    @IsUUID()
    branchId!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    hourlyRate?: number;

    @IsOptional()
    @IsBoolean()
    status?: boolean;
}
