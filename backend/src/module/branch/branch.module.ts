import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@/module/auth/auth.module';
import { BranchController } from './branch.controller';
import { BranchService } from './branch.service';
import { Branch } from './entities/branch.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Branch]), AuthModule],
    controllers: [BranchController],
    providers: [BranchService],
})
export class BranchModule {}
