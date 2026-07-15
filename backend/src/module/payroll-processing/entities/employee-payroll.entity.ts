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
import { Position } from '@/module/position/entities/position.entity';
import { EmployeePayrollStatus } from './employee-payroll-status.enum';
import { PayrollProcessing } from './payroll-processing.entity';

@Entity('employee_payrolls')
@Index(['payrollProcessingId', 'employeeId'], { unique: true })
@Index(['payrollPeriodId', 'employeeId'])
export class EmployeePayroll {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ name: 'payroll_processing_id', type: 'varchar', length: 36 })
    payrollProcessingId!: string;

    @ManyToOne(() => PayrollProcessing, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'payroll_processing_id' })
    payrollProcessing!: PayrollProcessing;

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

    @Column({ name: 'position_id', type: 'varchar', length: 36 })
    positionId!: string;

    @ManyToOne(() => Position, { nullable: false, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'position_id' })
    position!: Position;

    @Column({ name: 'employee_code', type: 'varchar', length: 50 })
    employeeCode!: string;

    @Column({ name: 'employee_name', type: 'varchar', length: 255 })
    employeeName!: string;

    @Column({ name: 'branch_name', type: 'varchar', length: 100 })
    branchName!: string;

    @Column({ name: 'position_name', type: 'varchar', length: 255 })
    positionName!: string;

    @Column({
        name: 'hourly_rate',
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0,
    })
    hourlyRate!: string;

    @Column({
        name: 'regular_multiplier',
        type: 'decimal',
        precision: 5,
        scale: 2,
        default: 1,
    })
    regularMultiplier!: string;

    @Column({
        name: 'overtime_multiplier',
        type: 'decimal',
        precision: 5,
        scale: 2,
        default: 1,
    })
    overtimeMultiplier!: string;

    @Column({
        name: 'holiday_multiplier',
        type: 'decimal',
        precision: 5,
        scale: 2,
        default: 1,
    })
    holidayMultiplier!: string;

    @Column({
        name: 'holiday_overtime_multiplier',
        type: 'decimal',
        precision: 5,
        scale: 2,
        default: 1,
    })
    holidayOvertimeMultiplier!: string;

    @Column({ name: 'worked_minutes', type: 'int', default: 0 })
    workedMinutes!: number;

    @Column({ name: 'overtime_minutes', type: 'int', default: 0 })
    overtimeMinutes!: number;

    @Column({ name: 'holiday_minutes', type: 'int', default: 0 })
    holidayMinutes!: number;

    @Column({ name: 'holiday_overtime_minutes', type: 'int', default: 0 })
    holidayOvertimeMinutes!: number;

    @Column({
        name: 'reward_total',
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0,
    })
    rewardTotal!: string;

    @Column({
        name: 'penalty_total',
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0,
    })
    penaltyTotal!: string;

    @Column({
        name: 'regular_pay',
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0,
    })
    regularPay!: string;

    @Column({
        name: 'overtime_pay',
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0,
    })
    overtimePay!: string;

    @Column({
        name: 'holiday_pay',
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0,
    })
    holidayPay!: string;

    @Column({
        name: 'holiday_overtime_pay',
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0,
    })
    holidayOvertimePay!: string;

    @Column({
        name: 'gross_pay',
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0,
    })
    grossPay!: string;

    @Column({
        name: 'net_pay',
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0,
    })
    netPay!: string;

    @Index()
    @Column({
        type: 'enum',
        enum: EmployeePayrollStatus,
        default: EmployeePayrollStatus.Success,
    })
    status!: EmployeePayrollStatus;

    @Column({ name: 'error_message', type: 'text', nullable: true })
    errorMessage!: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
