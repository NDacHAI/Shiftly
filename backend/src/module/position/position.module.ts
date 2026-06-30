import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@/module/auth/auth.module';
import { Branch } from '@/module/branch/entities/branch.entity';
import { UserModule } from '@/module/user/user.module';
import { Position } from './entities/position.entity';
import { PositionController } from './position.controller';
import { PositionService } from './position.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Position, Branch]),
        AuthModule,
        UserModule,
    ],
    controllers: [PositionController],
    providers: [PositionService],
})
export class PositionModule {}
