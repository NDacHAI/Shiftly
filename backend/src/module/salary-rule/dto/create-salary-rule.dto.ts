import { Type } from 'class-transformer';
import {
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Matches,
    Max,
    MaxLength,
    Min,
} from 'class-validator';
import { SalaryRuleStatus } from '../entities/salary-rule-status.enum';

export class CreateSalaryRuleDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    @Matches(/^[A-Z0-9_]+$/)
    code!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name!: string;

    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0.01)
    @Max(999.99)
    multiplier!: number;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    note?: string | null;

    @IsOptional()
    @Type(() => Number)
    @IsEnum(SalaryRuleStatus)
    status?: SalaryRuleStatus;
}
