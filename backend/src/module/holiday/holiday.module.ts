import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@/module/auth/auth.module';
import { Holiday } from './entities/holiday.entity';
import { HolidayController } from './holiday.controller';
import { HolidayService } from './holiday.service';

@Module({
    imports: [TypeOrmModule.forFeature([Holiday]), AuthModule],
    controllers: [HolidayController],
    providers: [HolidayService],
    exports: [HolidayService],
})
export class HolidayModule {}
