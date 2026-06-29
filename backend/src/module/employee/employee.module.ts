import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@/module/auth/auth.module';
import { Branch } from '@/module/branch/entities/branch.entity';
import { Position } from '@/module/position/entities/position.entity';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { Employee } from './entities/employee.entity';
import { UserModule } from '@/module/user/user.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Employee, Branch, Position]),
        AuthModule,
        UserModule,
    ],
    controllers: [EmployeeController],
    providers: [EmployeeService],
})
export class EmployeeModule { }
