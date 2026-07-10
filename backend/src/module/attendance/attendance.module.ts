import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Branch } from '@/module/branch/entities/branch.entity';
import { Employee } from '@/module/employee/entities/employee.entity';
import { Position } from '@/module/position/entities/position.entity';
import { User } from '@/module/user/entities/user.entity';
import { AuthModule } from '@/module/auth/auth.module';
import { UserModule } from '@/module/user/user.module';
import { WorkSchedule } from '@/module/work-schedule/entities/work-schedule.entity';
import { WorkShift } from '@/module/work-shift/entities/work-shift.entity';
import { AttendanceController } from './attendance.controller';
import { AttendanceAdjustment } from './entities/attendance-adjustment.entity';
import { Attendance } from './entities/attendance.entity';
import { AttendanceService } from './attendance.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Attendance,
            AttendanceAdjustment,
            WorkSchedule,
            Employee,
            Branch,
            Position,
            WorkShift,
            User,
        ]),
        AuthModule,
        UserModule,
    ],
    controllers: [AttendanceController],
    providers: [AttendanceService],
    exports: [AttendanceService],
})
export class AttendanceModule {}
