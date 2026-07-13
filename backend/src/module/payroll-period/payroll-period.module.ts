import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@/module/auth/auth.module';
import { PayrollPeriod } from './entities/payroll-period.entity';
import { PayrollPeriodController } from './payroll-period.controller';
import { PayrollPeriodService } from './payroll-period.service';

@Module({
    imports: [TypeOrmModule.forFeature([PayrollPeriod]), AuthModule],
    controllers: [PayrollPeriodController],
    providers: [PayrollPeriodService],
    exports: [PayrollPeriodService],
})
export class PayrollPeriodModule {}
