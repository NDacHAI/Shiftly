import { Transform } from 'class-transformer';
import { IsString, MaxLength } from 'class-validator';

export class ReviewLeaveRequestDto {
    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    @IsString()
    @MaxLength(1000)
    reviewNote!: string;
}
