import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Branch } from '../../branch/entities/branch.entity';

@Entity('positions')
export class Position {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ length: 50, unique: true })
    code!: string;

    @Column({ length: 255 })
    name!: string;

    @Index()
    @Column({ name: 'branch_id', type: 'varchar', length: 36 })
    branchId!: string;

    @ManyToOne(() => Branch, { nullable: false, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'branch_id' })
    branch!: Branch;

    @Column({ type: 'text', nullable: true })
    description!: string | null;

    @Column({
        name: 'hourly_rate',
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0,
    })
    hourlyRate!: string;

    @Index()
    @Column({ default: true })
    status!: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    @DeleteDateColumn({ name: 'deleted_at', nullable: true, select: false })
    deletedAt!: Date | null;
}
