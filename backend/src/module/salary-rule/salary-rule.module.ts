import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@/module/auth/auth.module';
import { SalaryRuleVersion } from './entities/salary-rule-version.entity';
import { SalaryRule } from './entities/salary-rule.entity';
import { SalaryRuleController } from './salary-rule.controller';
import { SalaryRuleService } from './salary-rule.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([SalaryRule, SalaryRuleVersion]),
        AuthModule,
    ],
    controllers: [SalaryRuleController],
    providers: [SalaryRuleService],
    exports: [SalaryRuleService],
})
export class SalaryRuleModule {}
