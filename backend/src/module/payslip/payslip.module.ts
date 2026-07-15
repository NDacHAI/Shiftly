import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@/module/auth/auth.module';
import { EmployeePayroll } from '@/module/payroll-processing/entities/employee-payroll.entity';
import { UserModule } from '@/module/user/user.module';
import { PayslipController } from './payslip.controller';
import { PayslipService } from './payslip.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([EmployeePayroll]),
        AuthModule,
        UserModule,
    ],
    controllers: [PayslipController],
    providers: [PayslipService],
})
export class PayslipModule {}
