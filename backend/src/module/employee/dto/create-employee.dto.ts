import { Transform } from 'class-transformer';
import {
    ArrayNotEmpty,
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

export class CreateEmployeeDto {
    @IsOptional()
    @IsString()
    @MaxLength(50)
    employeeCode?: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    firstName!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    lastName!: string;

    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string' ? value.trim().toLowerCase() : value,
    )
    @IsEmail()
    @MaxLength(255)
    email!: string;

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

    @IsArray()
    @ArrayNotEmpty()
    @IsUUID('4', { each: true })
    departmentIds!: string[];

    @IsArray()
    @ArrayNotEmpty()
    @IsUUID('4', { each: true })
    positionIds!: string[];

    @IsString()
    @IsNotEmpty()
    hireDate!: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsEnum(EmployeeStatus)
    status!: EmployeeStatus;
}
