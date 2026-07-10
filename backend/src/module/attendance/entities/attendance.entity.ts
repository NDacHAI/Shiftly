import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Branch } from '@/module/branch/entities/branch.entity';
import { Employee } from '@/module/employee/entities/employee.entity';
import { Position } from '@/module/position/entities/position.entity';
import { User } from '@/module/user/entities/user.entity';
import { WorkSchedule } from '@/module/work-schedule/entities/work-schedule.entity';
import { WorkShift } from '@/module/work-shift/entities/work-shift.entity';
import { AttendanceAdjustment } from './attendance-adjustment.entity';
import { AttendanceSource } from './attendance-source.enum';
import { AttendanceStatus } from './attendance-status.enum';

@Entity('attendances')
@Index(['employeeId', 'scheduleDate'])
@Index(['branchId', 'scheduleDate'])
@Index(['status', 'scheduleDate'])
export class Attendance {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'work_schedule_id', type: 'varchar', length: 36 })
    workScheduleId!: string;

    @OneToOne(() => WorkSchedule, { nullable: false, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'work_schedule_id' })
    workSchedule!: WorkSchedule;

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
    @Column({ name: 'schedule_date', type: 'date' })
    scheduleDate!: string;

    @Index()
    @Column({ name: 'scheduled_start_at', type: 'datetime' })
    scheduledStartAt!: Date;

    @Index()
    @Column({ name: 'scheduled_end_at', type: 'datetime' })
    scheduledEndAt!: Date;

    @Column({ name: 'break_minutes', type: 'int', default: 0 })
    breakMinutes!: number;

    @Column({ name: 'grace_minutes', type: 'int', default: 0 })
    graceMinutes!: number;

    @Column({ name: 'check_in_at', type: 'datetime', nullable: true })
    checkInAt!: Date | null;

    @Column({ name: 'check_out_at', type: 'datetime', nullable: true })
    checkOutAt!: Date | null;

    @Column({ name: 'late_minutes', type: 'int', default: 0 })
    lateMinutes!: number;

    @Column({ name: 'early_leave_minutes', type: 'int', default: 0 })
    earlyLeaveMinutes!: number;

    @Column({ name: 'overtime_minutes', type: 'int', default: 0 })
    overtimeMinutes!: number;

    @Column({ name: 'worked_minutes', type: 'int', default: 0 })
    workedMinutes!: number;

    @Index()
    @Column({
        type: 'enum',
        enum: AttendanceStatus,
        default: AttendanceStatus.CheckedIn,
    })
    status!: AttendanceStatus;

    @Index()
    @Column({
        type: 'enum',
        enum: AttendanceSource,
    })
    source!: AttendanceSource;

    @Column({ name: 'absence_reason', type: 'text', nullable: true })
    absenceReason!: string | null;

    @Column({ type: 'text', nullable: true })
    note!: string | null;

    @Index()
    @Column({ name: 'confirmed_by', type: 'int', nullable: true })
    confirmedById!: number | null;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'confirmed_by' })
    confirmedBy!: User | null;

    @Column({ name: 'confirmed_at', type: 'datetime', nullable: true })
    confirmedAt!: Date | null;

    @OneToMany(
        () => AttendanceAdjustment,
        (adjustment) => adjustment.attendance,
    )
    adjustments!: AttendanceAdjustment[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
