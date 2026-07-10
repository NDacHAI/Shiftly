import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '@/module/user/entities/user.entity';
import { Attendance } from './attendance.entity';
import { AttendanceAdjustmentAction } from './attendance-adjustment-action.enum';
import { AttendanceStatus } from './attendance-status.enum';

@Entity('attendance_adjustments')
@Index(['attendanceId', 'createdAt'])
export class AttendanceAdjustment {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ name: 'attendance_id', type: 'varchar', length: 36 })
    attendanceId!: string;

    @ManyToOne(() => Attendance, {
        nullable: false,
        onDelete: 'RESTRICT',
    })
    @JoinColumn({ name: 'attendance_id' })
    attendance!: Attendance;

    @Index()
    @Column({ name: 'adjusted_by', type: 'int' })
    adjustedById!: number;

    @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'adjusted_by' })
    adjustedBy!: User;

    @Index()
    @Column({
        name: 'action_type',
        type: 'enum',
        enum: AttendanceAdjustmentAction,
    })
    actionType!: AttendanceAdjustmentAction;

    @Column({
        name: 'old_status',
        type: 'enum',
        enum: AttendanceStatus,
        nullable: true,
    })
    oldStatus!: AttendanceStatus | null;

    @Column({
        name: 'new_status',
        type: 'enum',
        enum: AttendanceStatus,
        nullable: true,
    })
    newStatus!: AttendanceStatus | null;

    @Column({ name: 'old_check_in_at', type: 'datetime', nullable: true })
    oldCheckInAt!: Date | null;

    @Column({ name: 'new_check_in_at', type: 'datetime', nullable: true })
    newCheckInAt!: Date | null;

    @Column({ name: 'old_check_out_at', type: 'datetime', nullable: true })
    oldCheckOutAt!: Date | null;

    @Column({ name: 'new_check_out_at', type: 'datetime', nullable: true })
    newCheckOutAt!: Date | null;

    @Column({ name: 'old_worked_minutes', type: 'int', nullable: true })
    oldWorkedMinutes!: number | null;

    @Column({ name: 'new_worked_minutes', type: 'int', nullable: true })
    newWorkedMinutes!: number | null;

    @Column({ name: 'old_late_minutes', type: 'int', nullable: true })
    oldLateMinutes!: number | null;

    @Column({ name: 'new_late_minutes', type: 'int', nullable: true })
    newLateMinutes!: number | null;

    @Column({ name: 'old_early_leave_minutes', type: 'int', nullable: true })
    oldEarlyLeaveMinutes!: number | null;

    @Column({ name: 'new_early_leave_minutes', type: 'int', nullable: true })
    newEarlyLeaveMinutes!: number | null;

    @Column({ name: 'old_overtime_minutes', type: 'int', nullable: true })
    oldOvertimeMinutes!: number | null;

    @Column({ name: 'new_overtime_minutes', type: 'int', nullable: true })
    newOvertimeMinutes!: number | null;

    @Column({ type: 'text' })
    reason!: string;

    @Column({ type: 'text', nullable: true })
    note!: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;
}
