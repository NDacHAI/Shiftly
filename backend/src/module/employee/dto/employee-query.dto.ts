import { Transform, Type } from 'class-transformer';
import {
    IsEnum,
    IsIn,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    Min,
} from 'class-validator';
import { EmployeeStatus } from '../entities/employee-status.enum';

export const employeeSortFields = [
    'fullName',
    'createdAt',
    'employeeCode',
] as const;
export type EmployeeSortField = (typeof employeeSortFields)[number];

export class EmployeeQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit = 10;

    @IsOptional()
    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    @IsString()
    search?: string;

    @IsOptional()
    @IsUUID()
    branchId?: string;

    @IsOptional()
    @IsUUID()
    positionId?: string;

    @IsOptional()
    @IsEnum(EmployeeStatus)
    status?: EmployeeStatus;

    @IsOptional()
    @IsIn(employeeSortFields)
    sortBy: EmployeeSortField = 'createdAt';

    @IsOptional()
    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string' ? value.toUpperCase() : value,
    )
    @IsIn(['ASC', 'DESC'])
    sortOrder: 'ASC' | 'DESC' = 'DESC';
}
