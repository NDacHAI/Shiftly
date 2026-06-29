import {
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
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
    @IsBoolean()
    status?: boolean;
}
