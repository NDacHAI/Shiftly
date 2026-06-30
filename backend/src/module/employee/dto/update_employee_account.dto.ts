import { IsEnum } from 'class-validator';
import { UserRole } from '@/common/enum/role.enum';

export class UpdateEmployeeAccountDto {
    @IsEnum(UserRole)
    role!: UserRole;
}
