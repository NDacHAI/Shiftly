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
import { WorkShift } from '@/module/work-shift/entities/work-shift.entity';

@Entity('work_schedules')
@Index(['employeeId', 'workDate'], { unique: true })
@Index(['branchId', 'workDate'])
@Index(['positionId', 'workDate'])
export class WorkSchedule {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'employee_id', type: 'varchar', length: 36 })
    employeeId!: string;

    @ManyToOne(() => Employee, { nullable: false, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'employee_id' })
    employee!: Employee;

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

    @Index()
    @Column({ name: 'work_shift_id', type: 'varchar', length: 36 })
    workShiftId!: string;

    @ManyToOne(() => WorkShift, { nullable: false, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'work_shift_id' })
    workShift!: WorkShift;

    @Index()
    @Column({ name: 'work_date', type: 'date' })
    workDate!: string;

    @Column({ name: 'shift_code_snapshot', type: 'varchar', length: 50 })
    shiftCodeSnapshot!: string;

    @Column({ name: 'shift_name_snapshot', type: 'varchar', length: 50 })
    shiftNameSnapshot!: string;

    @Column({ name: 'start_time_snapshot', type: 'time' })
    startTimeSnapshot!: string;

    @Column({ name: 'end_time_snapshot', type: 'time' })
    endTimeSnapshot!: string;

    @Column({ name: 'break_minutes_snapshot', type: 'int' })
    breakMinutesSnapshot!: number;

    @Column({ type: 'text', nullable: true })
    note!: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
