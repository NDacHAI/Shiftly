import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@/module/auth/auth.module';
import { Department } from '@/module/department/entities/department.entity';
import { Position } from '@/module/position/entities/position.entity';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { Employee } from './entities/employee.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Employee, Department, Position]),
        AuthModule,
    ],
    controllers: [EmployeeController],
    providers: [EmployeeService],
})
export class EmployeeModule {}
