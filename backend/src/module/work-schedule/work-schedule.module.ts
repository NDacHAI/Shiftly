import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@/module/auth/auth.module';
import { Branch } from '@/module/branch/entities/branch.entity';
import { Employee } from '@/module/employee/entities/employee.entity';
import { Position } from '@/module/position/entities/position.entity';
import { UserModule } from '@/module/user/user.module';
import { WorkShift } from '@/module/work-shift/entities/work-shift.entity';
import { WorkSchedule } from './entities/work-schedule.entity';
import { WorkScheduleController } from './work-schedule.controller';
import { WorkScheduleService } from './work-schedule.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            WorkSchedule,
            Employee,
            Branch,
            Position,
            WorkShift,
        ]),
        AuthModule,
        UserModule,
    ],
    controllers: [WorkScheduleController],
    providers: [WorkScheduleService],
    exports: [WorkScheduleService],
})
export class WorkScheduleModule {}
