import { EntityManager } from 'typeorm';
import { SalaryRuleStatus } from '@/module/salary-rule/entities/salary-rule-status.enum';
import { SalaryRuleVersion } from '@/module/salary-rule/entities/salary-rule-version.entity';
import { SalaryRule } from '@/module/salary-rule/entities/salary-rule.entity';
import { defaultSalaryRules } from '@/module/salary-rule/salary-rule.constants';

const defaultEffectiveFrom = '1970-01-01';
const defaultVersionNote = 'Hệ số mặc định ban đầu';

export async function seedDefaultSalaryRules(
    manager: EntityManager,
): Promise<void> {
    const salaryRuleRepository = manager.getRepository(SalaryRule);
    const versionRepository = manager.getRepository(SalaryRuleVersion);

    for (const defaultRule of defaultSalaryRules) {
        let salaryRule = await salaryRuleRepository.findOne({
            where: { code: defaultRule.code },
        });

        if (salaryRule) {
            salaryRule.name = defaultRule.name;
            salaryRule.status = SalaryRuleStatus.Active;
            salaryRule = await salaryRuleRepository.save(salaryRule);
        } else {
            salaryRule = await salaryRuleRepository.save(
                salaryRuleRepository.create({
                    code: defaultRule.code,
                    name: defaultRule.name,
                    status: SalaryRuleStatus.Active,
                }),
            );
        }

        const version = await versionRepository.findOne({
            where: {
                salaryRuleId: salaryRule.id,
                effectiveFrom: defaultEffectiveFrom,
            },
        });

        if (version) {
            version.multiplier = defaultRule.multiplier;
            version.effectiveTo = null;
            version.note = defaultVersionNote;
            await versionRepository.save(version);
            continue;
        }

        await versionRepository.save(
            versionRepository.create({
                salaryRuleId: salaryRule.id,
                multiplier: defaultRule.multiplier,
                effectiveFrom: defaultEffectiveFrom,
                effectiveTo: null,
                note: defaultVersionNote,
            }),
        );
    }
}
