import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@/module/auth/auth.module';
import { Branch } from '@/module/branch/entities/branch.entity';
import { Employee } from '@/module/employee/entities/employee.entity';
import { PayrollPeriod } from '@/module/payroll-period/entities/payroll-period.entity';
import { RewardPenaltyCatalog } from '@/module/reward-penalty-catalog/entities/reward-penalty-catalog.entity';
import { UserModule } from '@/module/user/user.module';
import { PayrollAdjustment } from './entities/payroll-adjustment.entity';
import { PayrollAdjustmentController } from './payroll-adjustment.controller';
import { PayrollAdjustmentService } from './payroll-adjustment.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            PayrollAdjustment,
            PayrollPeriod,
            Employee,
            Branch,
            RewardPenaltyCatalog,
        ]),
        AuthModule,
        UserModule,
    ],
    controllers: [PayrollAdjustmentController],
    providers: [PayrollAdjustmentService],
    exports: [PayrollAdjustmentService],
})
export class PayrollAdjustmentModule {}
