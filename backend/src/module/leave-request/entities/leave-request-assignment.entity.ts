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
import { WorkSchedule } from '@/module/work-schedule/entities/work-schedule.entity';
import { LeaveRequest } from './leave-request.entity';

@Entity('leave_request_assignments')
@Index(['leaveRequestId', 'workScheduleId'], { unique: true })
export class LeaveRequestAssignment {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ name: 'leave_request_id', type: 'varchar', length: 36 })
    leaveRequestId!: string;

    @ManyToOne(() => LeaveRequest, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'leave_request_id' })
    leaveRequest!: LeaveRequest;

    @Index()
    @Column({ name: 'work_schedule_id', type: 'varchar', length: 36 })
    workScheduleId!: string;

    @ManyToOne(() => WorkSchedule, { nullable: false, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'work_schedule_id' })
    workSchedule!: WorkSchedule;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
