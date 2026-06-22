import { IsString, MinLength } from 'class-validator';

export class ResetEmployeePasswordDto {
    @IsString()
    @MinLength(6)
    temporaryPassword!: string;
}
