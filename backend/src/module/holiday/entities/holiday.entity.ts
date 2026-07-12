import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { HolidayStatus } from './holiday-status.enum';

@Entity('holidays')
export class Holiday {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Index({ unique: true })
    @Column({ name: 'holiday_date', type: 'date' })
    holidayDate!: string;

    @Column({ type: 'text', nullable: true })
    description!: string | null;

    @Index()
    @Column({
        name: 'status',
        type: 'tinyint',
        default: HolidayStatus.Active,
    })
    status!: HolidayStatus;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
