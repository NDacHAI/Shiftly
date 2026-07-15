import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

const payslipSortFields = [
    'createdAt',
    'employeeCode',
    'employeeName',
    'grossPay',
    'netPay',
] as const;

export type PayslipSortField = (typeof payslipSortFields)[number];

export class PayslipQueryDto {
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
    @IsString()
    payrollPeriodId?: string;

    @IsOptional()
    @IsString()
    branchId?: string;

    @IsOptional()
    @IsString()
    employeeId?: string;

    @IsOptional()
    @IsIn(payslipSortFields)
    sortBy: PayslipSortField = 'createdAt';

    @IsOptional()
    @IsIn(['ASC', 'DESC'])
    sortOrder: 'ASC' | 'DESC' = 'DESC';
}
