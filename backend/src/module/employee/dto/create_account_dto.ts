import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '@/common/enum/role.enum';

export class CreateEmployeeAccountDto {
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @IsString()
    @MinLength(6)
    temporaryPassword!: string;
}
