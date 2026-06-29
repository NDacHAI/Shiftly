import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '@/common/enum/role.enum';
import { Employee } from '@/module/employee/entities/employee.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true, length: 150 })
    email!: string;

    @Column()
    password!: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.User,
    })
    role!: UserRole;

    @Column({ default: true })
    isActive!: boolean;

    @Column({ type: 'varchar', length: 255, nullable: true })
    refreshTokenHash!: string | null;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @Column({ type: 'boolean', default: false, name: 'is_master' })
    isMaster!: boolean;

    @Column({
        name: 'must_change_password',
        type: 'boolean',
        default: false,
    })
    mustChangePassword!: boolean;

    @Column({ name: 'employee_id', type: 'varchar', length: 36, nullable: true })
    employeeId!: string | null;

    @OneToOne(() => Employee, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({
        name: 'employee_id',
        referencedColumnName: 'id',
    })
    employee!: Employee | null;
}
