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
import { Branch } from '@/module/branch/entities/branch.entity';
import { Employee } from '@/module/employee/entities/employee.entity';
import { PayrollPeriod } from '@/module/payroll-period/entities/payroll-period.entity';
import { RewardPenaltyCatalog } from '@/module/reward-penalty-catalog/entities/reward-penalty-catalog.entity';
import { RewardPenaltyCategory } from '@/module/reward-penalty-catalog/entities/reward-penalty-category.enum';
import { User } from '@/module/user/entities/user.entity';

@Entity('payroll_adjustments')
@Index(['payrollPeriodId', 'employeeId'])
@Index(['payrollPeriodId', 'branchId'])
@Index(['payrollPeriodId', 'category'])
export class PayrollAdjustment {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ name: 'payroll_period_id', type: 'varchar', length: 36 })
    payrollPeriodId!: string;

    @ManyToOne(() => PayrollPeriod, { nullable: false, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'payroll_period_id' })
    payrollPeriod!: PayrollPeriod;

    @Index()
    @Column({ name: 'employee_id', type: 'varchar', length: 36 })
    employeeId!: string;

    @ManyToOne(() => Employee, { nullable: false, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'employee_id' })
    employee!: Employee;

    @Index()
    @Column({ name: 'branch_id', type: 'varchar', length: 36 })
    branchId!: string;

    @ManyToOne(() => Branch, { nullable: false, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'branch_id' })
    branch!: Branch;

    @Index()
    @Column({ name: 'catalog_id', type: 'varchar', length: 36 })
    catalogId!: string;

    @ManyToOne(() => RewardPenaltyCatalog, {
        nullable: false,
        onDelete: 'RESTRICT',
    })
    @JoinColumn({ name: 'catalog_id' })
    catalog!: RewardPenaltyCatalog;

    @Column({ name: 'catalog_code', type: 'varchar', length: 50 })
    catalogCode!: string;

    @Column({ name: 'catalog_name', type: 'varchar', length: 255 })
    catalogName!: string;

    @Index()
    @Column({ type: 'tinyint' })
    category!: RewardPenaltyCategory;

    @Column({
        type: 'decimal',
        precision: 12,
        scale: 2,
    })
    amount!: string;

    @Column({ type: 'varchar', length: 500 })
    reason!: string;

    @Index()
    @Column({ name: 'adjustment_date', type: 'date' })
    adjustmentDate!: string;

    @Index()
    @Column({ name: 'created_by_user_id', type: 'int' })
    createdByUserId!: number;

    @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'created_by_user_id' })
    createdByUser!: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
