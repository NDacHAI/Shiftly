import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@/module/auth/auth.module';
import { Department } from '@/module/department/entities/department.entity';
import { Position } from './entities/position.entity';
import { PositionController } from './position.controller';
import { PositionService } from './position.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Position, Department]),
        AuthModule,
    ],
    controllers: [PositionController],
    providers: [PositionService],
})
export class PositionModule {}
