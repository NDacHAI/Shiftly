import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { SalaryRuleStatus } from './salary-rule-status.enum';
import { SalaryRuleVersion } from './salary-rule-version.entity';

@Entity('salary_rules')
export class SalaryRule {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index({ unique: true })
    @Column({ type: 'varchar', length: 50 })
    code!: string;

    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Index()
    @Column({
        name: 'status',
        type: 'tinyint',
        default: SalaryRuleStatus.Active,
    })
    status!: SalaryRuleStatus;

    @OneToMany(() => SalaryRuleVersion, (version) => version.salaryRule)
    versions!: SalaryRuleVersion[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
