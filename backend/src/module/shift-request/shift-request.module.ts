import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Branch } from '@/module/branch/entities/branch.entity';
import { AuthJwtModule } from '@/module/auth/auth-jwt.module';
import { Employee } from '@/module/employee/entities/employee.entity';
import { Position } from '@/module/position/entities/position.entity';
import { UserModule } from '@/module/user/user.module';
import { WorkSchedule } from '@/module/work-schedule/entities/work-schedule.entity';
import { WorkShift } from '@/module/work-shift/entities/work-shift.entity';
import { ShiftRequest } from './entities/shift-request.entity';
import { ShiftRequestController } from './shift-request.controller';
import { ShiftRequestService } from './shift-request.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            ShiftRequest,
            WorkSchedule,
            Employee,
            Branch,
            Position,
            WorkShift,
        ]),
        AuthJwtModule,
        UserModule,
    ],
    controllers: [ShiftRequestController],
    providers: [ShiftRequestService],
    exports: [ShiftRequestService],
})
export class ShiftRequestModule {}
