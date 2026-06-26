import { IsNotEmpty, IsString, IsOptional, IsInt, Min, MaxLength, IsEnum, Matches, Max } from "class-validator";
import { Status } from "../enum/status.enum";
import { Type } from "class-transformer";

export class CreateWorkShiftDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    code!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    name!: string;

    @IsString()
    @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    startTime!: string;

    @IsString()
    @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    endTime!: string;

    @Type(() => Number)
    @IsInt()
    @Min(0)
    @Max(1440)
    breakMinutes: number;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(Status)
    status?: Status;
}