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
  ]
})
export class AppModule { }
