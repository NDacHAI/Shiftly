import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from '@/module/attendance/entities/attendance.entity';
import { AuthModule } from '@/module/auth/auth.module';
import { Branch } from '@/module/branch/entities/branch.entity';
import { Employee } from '@/module/employee/entities/employee.entity';
import { Holiday } from '@/module/holiday/entities/holiday.entity';
import { LeaveRequestAssignment } from '@/module/leave-request/entities/leave-request-assignment.entity';
import { LeaveRequest } from '@/module/leave-request/entities/leave-request.entity';
import { PayrollPeriod } from '@/module/payroll-period/entities/payroll-period.entity';
import { EmployeePayroll } from '@/module/payroll-processing/entities/employee-payroll.entity';
import { PayrollProcessing } from '@/module/payroll-processing/entities/payroll-processing.entity';
import { ShiftRequest } from '@/module/shift-request/entities/shift-request.entity';
import { UserModule } from '@/module/user/user.module';
import { WorkSchedule } from '@/module/work-schedule/entities/work-schedule.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            WorkSchedule,
            Attendance,
            LeaveRequest,
            LeaveRequestAssignment,
            ShiftRequest,
            Holiday,
            PayrollPeriod,
            PayrollProcessing,
            EmployeePayroll,
            Employee,
            Branch,
        ]),
        AuthModule,
        UserModule,
    ],
    controllers: [DashboardController],
    providers: [DashboardService],
})
export class DashboardModule {}
