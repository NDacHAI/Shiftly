import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class DashboardQueryDto {
    @IsOptional()
    @IsUUID()
    branchId?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(7)
    @Max(90)
    days = 7;
}
