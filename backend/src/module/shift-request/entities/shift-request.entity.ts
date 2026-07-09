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
import { Position } from '@/module/position/entities/position.entity';
import { User } from '@/module/user/entities/user.entity';
import { WorkShift } from '@/module/work-shift/entities/work-shift.entity';
import { ShiftRequestStatus } from './shift-request-status.enum';

@Entity('shift_requests')
@Index(['employeeId', 'workDate'])
@Index(['branchId', 'workDate'])
@Index([
    'employeeId',
    'branchId',
    'positionId',
    'workShiftId',
    'workDate',
    'status',
])
export class ShiftRequest {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

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
    @Column({ name: 'position_id', type: 'varchar', length: 36 })
    positionId!: string;

    @ManyToOne(() => Position, { nullable: false, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'position_id' })
    position!: Position;

    @Index()
    @Column({ name: 'work_shift_id', type: 'varchar', length: 36 })
    workShiftId!: string;

    @ManyToOne(() => WorkShift, { nullable: false, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'work_shift_id' })
    workShift!: WorkShift;

    @Index()
    @Column({ name: 'work_date', type: 'date' })
    workDate!: string;

    @Index()
    @Column({
        type: 'tinyint',
        default: ShiftRequestStatus.Pending,
    })
    status!: ShiftRequestStatus;

    @Column({ name: 'employee_note', type: 'text', nullable: true })
    employeeNote!: string | null;

    @Column({ name: 'manager_note', type: 'text', nullable: true })
    managerNote!: string | null;

    @Index()
    @Column({ name: 'reviewed_by', type: 'int', nullable: true })
    reviewedById!: number | null;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'reviewed_by' })
    reviewedBy!: User | null;

    @Column({ name: 'reviewed_at', type: 'datetime', nullable: true })
    reviewedAt!: Date | null;

    @Index()
    @Column({ name: 'cancelled_by', type: 'int', nullable: true })
    cancelledById!: number | null;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'cancelled_by' })
    cancelledBy!: User | null;

    @Column({ name: 'cancelled_at', type: 'datetime', nullable: true })
    cancelledAt!: Date | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
