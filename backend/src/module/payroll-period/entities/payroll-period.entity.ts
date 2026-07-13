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
import { User } from '@/module/user/entities/user.entity';
import { PayrollPeriodStatus } from './payroll-period-status.enum';

@Entity('payroll_periods')
@Index(['payrollMonth', 'payrollYear'], { unique: true })
@Index(['startDate', 'endDate'])
export class PayrollPeriod {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index({ unique: true })
    @Column({ type: 'varchar', length: 50 })
    code!: string;

    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Column({ name: 'payroll_month', type: 'tinyint' })
    payrollMonth!: number;

    @Column({ name: 'payroll_year', type: 'smallint' })
    payrollYear!: number;

    @Column({ name: 'start_date', type: 'date' })
    startDate!: string;

    @Column({ name: 'end_date', type: 'date' })
    endDate!: string;

    @Index()
    @Column({
        type: 'enum',
        enum: PayrollPeriodStatus,
        default: PayrollPeriodStatus.Draft,
    })
    status!: PayrollPeriodStatus;

    @Column({ name: 'opened_at', type: 'datetime', nullable: true })
    openedAt!: Date | null;

    @Column({ name: 'closed_at', type: 'datetime', nullable: true })
    closedAt!: Date | null;

    @Index()
    @Column({ name: 'created_by', type: 'int', nullable: true })
    createdById!: number | null;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'created_by' })
    createdBy!: User | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
