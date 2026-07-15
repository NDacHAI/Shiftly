import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { PayrollPeriod } from '@/module/payroll-period/entities/payroll-period.entity';
import { User } from '@/module/user/entities/user.entity';
import { EmployeePayroll } from './employee-payroll.entity';
import { PayrollProcessingStatus } from './payroll-processing-status.enum';

@Entity('payroll_processings')
export class PayrollProcessing {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index({ unique: true })
    @Column({ name: 'payroll_period_id', type: 'varchar', length: 36 })
    payrollPeriodId!: string;

    @ManyToOne(() => PayrollPeriod, { nullable: false, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'payroll_period_id' })
    payrollPeriod!: PayrollPeriod;

    @Index()
    @Column({
        type: 'enum',
        enum: PayrollProcessingStatus,
        default: PayrollProcessingStatus.Draft,
    })
    status!: PayrollProcessingStatus;

    @Column({ name: 'total_employees', type: 'int', default: 0 })
    totalEmployees!: number;

    @Column({ name: 'processed_employees', type: 'int', default: 0 })
    processedEmployees!: number;

    @Column({ name: 'success_count', type: 'int', default: 0 })
    successCount!: number;

    @Column({ name: 'failed_count', type: 'int', default: 0 })
    failedCount!: number;

    @Column({ name: 'generated_at', type: 'datetime', nullable: true })
    generatedAt!: Date | null;

    @Index()
    @Column({ name: 'generated_by_user_id', type: 'int', nullable: true })
    generatedByUserId!: number | null;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'generated_by_user_id' })
    generatedByUser!: User | null;

    @Column({ name: 'closed_at', type: 'datetime', nullable: true })
    closedAt!: Date | null;

    @Index()
    @Column({ name: 'closed_by_user_id', type: 'int', nullable: true })
    closedByUserId!: number | null;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'closed_by_user_id' })
    closedByUser!: User | null;

    @Column({ name: 'error_message', type: 'text', nullable: true })
    errorMessage!: string | null;

    @OneToMany(
        () => EmployeePayroll,
        (employeePayroll) => employeePayroll.payrollProcessing,
    )
    employeePayrolls!: EmployeePayroll[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
