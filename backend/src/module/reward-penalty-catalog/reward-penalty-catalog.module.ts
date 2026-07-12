import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@/module/auth/auth.module';
import { RewardPenaltyCatalog } from './entities/reward-penalty-catalog.entity';
import { RewardPenaltyCatalogController } from './reward-penalty-catalog.controller';
import { RewardPenaltyCatalogService } from './reward-penalty-catalog.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([RewardPenaltyCatalog]),
        AuthModule,
    ],
    controllers: [RewardPenaltyCatalogController],
    providers: [RewardPenaltyCatalogService],
    exports: [RewardPenaltyCatalogService],
})
export class RewardPenaltyCatalogModule {}
