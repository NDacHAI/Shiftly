import { Type } from 'class-transformer';
import {
    IsEnum,
    IsIn,
    IsInt,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';
import { EmployeePayrollStatus } from '../entities/employee-payroll-status.enum';

const employeePayrollSortFields = [
    'createdAt',
    'employeeCode',
    'employeeName',
    'grossPay',
    'netPay',
    'status',
] as const;

export type EmployeePayrollSortField =
    (typeof employeePayrollSortFields)[number];

export class EmployeePayrollQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit = 10;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsEnum(EmployeePayrollStatus)
    status?: EmployeePayrollStatus;

    @IsOptional()
    @IsString()
    branchId?: string;

    @IsOptional()
    @IsIn(employeePayrollSortFields)
    sortBy: EmployeePayrollSortField = 'employeeCode';

    @IsOptional()
    @IsIn(['ASC', 'DESC'])
    sortOrder: 'ASC' | 'DESC' = 'ASC';
}
