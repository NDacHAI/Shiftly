import { Type } from 'class-transformer';
import {
    IsDateString,
    IsNumber,
    IsString,
    IsUUID,
    Max,
    MaxLength,
    Min,
} from 'class-validator';

export class CreatePayrollAdjustmentDto {
    @IsUUID()
    payrollPeriodId!: string;

    @IsUUID()
    employeeId!: string;

    @IsUUID()
    branchId!: string;

    @IsUUID()
    catalogId!: string;

    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0.01)
    @Max(9999999999.99)
    amount!: number;

    @IsString()
    @MaxLength(500)
    reason!: string;

    @IsDateString()
    adjustmentDate!: string;
}
