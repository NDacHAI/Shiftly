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
import { Department } from '../../department/entities/department.entity';

@Entity('positions')
export class Position {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ length: 50, unique: true })
    code!: string;

    @Column({ length: 255 })
    name!: string;

    @Index()
    @Column({ name: 'department_id', type: 'varchar', length: 36 })
    departmentId!: string;

    @ManyToOne(() => Department, { nullable: false, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'department_id' })
    department!: Department;

    @Column({ type: 'text', nullable: true })
    description!: string | null;

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
