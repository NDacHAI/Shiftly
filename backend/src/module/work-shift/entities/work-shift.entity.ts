import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Status } from "../enum/status.enum";

@Entity('work_shifts')
export class WorkShift {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', unique: true, length: 50 })
    code: string;

    @Column({ unique: true, length: 50 })
    name: string;

    @Column({ type: 'time', name: 'start_time' })
    startTime: string;

    @Column({ type: 'time', name: 'end_time' })
    endTime: string;

    @Column({ type: 'int', default: 0, name: 'break_minutes' })
    breakMinutes: number;

    @Column({ type: 'boolean', default: false, name: 'is_overnight' })
    isOvernight: boolean;

    @Column({ type: 'text', name: 'description', nullable: true })
    description: string | null;

    @Column({ type: 'tinyint', default: Status.ACTIVE, name: 'status' })
    status: Status;

    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
    updatedAt: Date;

}