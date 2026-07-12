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
import { Branch } from '@/module/branch/entities/branch.entity';
import { Employee } from '@/module/employee/entities/employee.entity';
import { User } from '@/module/user/entities/user.entity';
import { LeaveRequestAssignment } from './leave-request-assignment.entity';
import { LeaveRequestMode } from './leave-request-mode.enum';
import { LeaveRequestStatus } from './leave-request-status.enum';

@Entity('leave_requests')
@Index(['employeeId', 'status'])
@Index(['employeeId', 'startDate', 'endDate'])
@Index(['branchId', 'status'])
export class LeaveRequest {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index({ unique: true })
    @Column({ type: 'varchar', length: 50 })
    code!: string;

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
    @Column({
        name: 'request_mode',
        type: 'enum',
        enum: LeaveRequestMode,
    })
    requestMode!: LeaveRequestMode;

    @Column({ name: 'start_date', type: 'date', nullable: true })
    startDate!: string | null;

    @Column({ name: 'end_date', type: 'date', nullable: true })
    endDate!: string | null;

    @Column({ name: 'is_full_day', type: 'boolean', nullable: true })
    isFullDay!: boolean | null;

    @Column({ name: 'start_time', type: 'time', nullable: true })
    startTime!: string | null;

    @Column({ name: 'end_time', type: 'time', nullable: true })
    endTime!: string | null;

    @Column({ type: 'text' })
    reason!: string;

    @Index()
    @Column({
        type: 'enum',
        enum: LeaveRequestStatus,
        default: LeaveRequestStatus.Pending,
    })
    status!: LeaveRequestStatus;

    @Index()
    @Column({ name: 'created_by_user_id', type: 'int' })
    createdByUserId!: number;

    @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'created_by_user_id' })
    createdByUser!: User;

    @Index()
    @Column({ name: 'reviewed_by_user_id', type: 'int', nullable: true })
    reviewedByUserId!: number | null;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'reviewed_by_user_id' })
    reviewedByUser!: User | null;

    @Column({ name: 'review_note', type: 'text', nullable: true })
    reviewNote!: string | null;

    @Column({ name: 'reviewed_at', type: 'datetime', nullable: true })
    reviewedAt!: Date | null;

    @Index()
    @Column({ name: 'cancelled_by_user_id', type: 'int', nullable: true })
    cancelledByUserId!: number | null;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'cancelled_by_user_id' })
    cancelledByUser!: User | null;

    @Column({ name: 'cancel_reason', type: 'text', nullable: true })
    cancelReason!: string | null;

    @Column({ name: 'cancelled_at', type: 'datetime', nullable: true })
    cancelledAt!: Date | null;

    @OneToMany(
        () => LeaveRequestAssignment,
        (assignment) => assignment.leaveRequest,
    )
    assignments!: LeaveRequestAssignment[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
