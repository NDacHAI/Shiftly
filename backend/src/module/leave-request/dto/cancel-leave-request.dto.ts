import { Transform } from 'class-transformer';
import { IsString, MaxLength } from 'class-validator';

export class CancelLeaveRequestDto {
    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    @IsString()
    @MaxLength(1000)
    cancelReason!: string;
}
