import { IsBoolean } from 'class-validator';

export class UpdatePositionStatusDto {
    @IsBoolean()
    status!: boolean;
}
