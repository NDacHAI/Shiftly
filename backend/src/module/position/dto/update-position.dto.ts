import {
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
} from 'class-validator';

export class UpdatePositionDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name?: string;

    @IsOptional()
    @IsUUID()
    branchId?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsBoolean()
    status?: boolean;
}
