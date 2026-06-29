import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('branches')
export class Branch {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ length: 20, unique: true })
    code!: string;

    @Column({ length: 100, unique: true })
    name!: string;

    @Column({ type: 'text', nullable: true })
    description!: string | null;

    @Column({ default: true })
    status!: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    @DeleteDateColumn({ name: 'deleted_at', nullable: true, select: false })
    deletedAt!: Date | null;
}
