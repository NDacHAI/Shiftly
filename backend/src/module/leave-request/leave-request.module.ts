import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from '@/module/attendance/entities/attendance.entity';
import { AuthJwtModule } from '@/module/auth/auth-jwt.module';
import { Branch } from '@/module/branch/entities/branch.entity';
import { Employee } from '@/module/employee/entities/employee.entity';
import { UserModule } from '@/module/user/user.module';
import { WorkSchedule } from '@/module/work-schedule/entities/work-schedule.entity';
import { LeaveRequestAssignment } from './entities/leave-request-assignment.entity';
import { LeaveRequest } from './entities/leave-request.entity';
import { LeaveRequestController } from './leave-request.controller';
import { LeaveRequestService } from './leave-request.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            LeaveRequest,
            LeaveRequestAssignment,
            WorkSchedule,
            Attendance,
            Employee,
            Branch,
        ]),
        AuthJwtModule,
        UserModule,
    ],
    controllers: [LeaveRequestController],
    providers: [LeaveRequestService],
    exports: [LeaveRequestService],
})
export class LeaveRequestModule {}
