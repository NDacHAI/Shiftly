import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { SalaryRule } from './salary-rule.entity';

@Entity('salary_rule_versions')
@Index(['salaryRuleId', 'effectiveFrom'], { unique: true })
export class SalaryRuleVersion {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ name: 'salary_rule_id', type: 'varchar', length: 36 })
    salaryRuleId!: string;

    @ManyToOne(() => SalaryRule, (salaryRule) => salaryRule.versions, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'salary_rule_id' })
    salaryRule!: SalaryRule;

    @Column({
        type: 'decimal',
        precision: 5,
        scale: 2,
    })
    multiplier!: string;

    @Index()
    @Column({ name: 'effective_from', type: 'date' })
    effectiveFrom!: string;

    @Index()
    @Column({ name: 'effective_to', type: 'date', nullable: true })
    effectiveTo!: string | null;

    @Column({ type: 'text', nullable: true })
    note!: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
