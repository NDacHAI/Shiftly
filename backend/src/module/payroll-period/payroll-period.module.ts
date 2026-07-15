import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@/module/auth/auth.module';
import { PayrollProcessing } from '@/module/payroll-processing/entities/payroll-processing.entity';
import { PayrollPeriod } from './entities/payroll-period.entity';
import { PayrollPeriodController } from './payroll-period.controller';
import { PayrollPeriodService } from './payroll-period.service';

@Module({
    imports: [TypeOrmModule.forFeature([PayrollPeriod, PayrollProcessing]), AuthModule],
    controllers: [PayrollPeriodController],
    providers: [PayrollPeriodService],
    exports: [PayrollPeriodService],
})
export class PayrollPeriodModule {}
