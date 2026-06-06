import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@/module/auth/auth.module';
import { DepartmentController } from './department.controller';
import { DepartmentService } from './department.service';
import { Department } from './entities/department.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Department]), AuthModule],
    controllers: [DepartmentController],
    providers: [DepartmentService],
})
export class DepartmentModule {}
