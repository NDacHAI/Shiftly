import { Transform } from 'class-transformer';
import {
    IsArray,
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
} from 'class-validator';
import { EmployeeStatus } from '../entities/employee-status.enum';

export class UpdateEmployeeDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    employeeCode?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    firstName?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    lastName?: string;

    @IsOptional()
    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string' ? value.trim().toLowerCase() : value,
    )
    @IsEmail()
    @MaxLength(255)
    email?: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    phoneNumber?: string;

    @IsOptional()
    @IsString()
    dateOfBirth?: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    gender?: string;

    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    departmentIds?: string[];

    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    positionIds?: string[];

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    hireDate?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsEnum(EmployeeStatus)
    status?: EmployeeStatus;
}
