import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envConfig } from './config/env.config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './module/auth/auth.module';
import { UserModule } from './module/user/user.module';
import { BranchModule } from './module/branch/branch.module';
import { PositionModule } from './module/position/position.module';
import { EmployeeModule } from './module/employee/employee.module';
import { WorkShiftModule } from './module/work-shift/work-shift.module';
import { WorkScheduleModule } from './module/work-schedule/work-schedule.module';
import { ShiftRequestModule } from './module/shift-request/shift-request.module';
import { AttendanceModule } from './module/attendance/attendance.module';
import { LeaveRequestModule } from './module/leave-request/leave-request.module';
import { HolidayModule } from './module/holiday/holiday.module';
import { SalaryRuleModule } from './module/salary-rule/salary-rule.module';
import { RewardPenaltyCatalogModule } from './module/reward-penalty-catalog/reward-penalty-catalog.module';
import { PayrollPeriodModule } from './module/payroll-period/payroll-period.module';
import { PayrollAdjustmentModule } from './module/payroll-adjustment/payroll-adjustment.module';

@Module({
  imports: [
    ConfigModule.forRoot(envConfig),
    DatabaseModule,
    AuthModule,
    UserModule,
    BranchModule,
    PositionModule,
    EmployeeModule,
    WorkShiftModule,
    WorkScheduleModule,
    ShiftRequestModule,
    AttendanceModule,
    LeaveRequestModule,
    HolidayModule,
    SalaryRuleModule,
    RewardPenaltyCatalogModule,
    PayrollPeriodModule,
    PayrollAdjustmentModule,
  ]
})
export class AppModule { }
