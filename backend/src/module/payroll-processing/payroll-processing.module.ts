import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@/module/auth/auth.module';
import { Attendance } from '@/module/attendance/entities/attendance.entity';
import { Employee } from '@/module/employee/entities/employee.entity';
import { Holiday } from '@/module/holiday/entities/holiday.entity';
import { PayrollAdjustment } from '@/module/payroll-adjustment/entities/payroll-adjustment.entity';
import { PayrollPeriod } from '@/module/payroll-period/entities/payroll-period.entity';
import { SalaryRuleVersion } from '@/module/salary-rule/entities/salary-rule-version.entity';
import { SalaryRule } from '@/module/salary-rule/entities/salary-rule.entity';
import { UserModule } from '@/module/user/user.module';
import { EmployeePayroll } from './entities/employee-payroll.entity';
import { PayrollProcessing } from './entities/payroll-processing.entity';
import { PayrollProcessingController } from './payroll-processing.controller';
import { PayrollProcessingService } from './payroll-processing.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            PayrollProcessing,
            EmployeePayroll,
            PayrollPeriod,
            Employee,
            Attendance,
            PayrollAdjustment,
            SalaryRule,
            SalaryRuleVersion,
            Holiday,
        ]),
        AuthModule,
        UserModule,
    ],
    controllers: [PayrollProcessingController],
    providers: [PayrollProcessingService],
    exports: [PayrollProcessingService],
})
export class PayrollProcessingModule {}
