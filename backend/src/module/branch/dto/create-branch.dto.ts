import {
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

export class CreateBranchDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    code!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsBoolean()
    status?: boolean;
}
