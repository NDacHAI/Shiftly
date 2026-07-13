import { Type } from 'class-transformer';
import { IsDateString, IsInt, Max, Min } from 'class-validator';

export class CreatePayrollPeriodDto {
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(12)
    payrollMonth!: number;

    @Type(() => Number)
    @IsInt()
    @Min(2000)
    @Max(2100)
    payrollYear!: number;

    @IsDateString()
    startDate!: string;

    @IsDateString()
    endDate!: string;
}
