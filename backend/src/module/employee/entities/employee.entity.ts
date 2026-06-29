import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinTable,
    ManyToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Branch } from '@/module/branch/entities/branch.entity';
import { Position } from '@/module/position/entities/position.entity';
import { EmployeeStatus } from './employee-status.enum';

@Entity('employees')
export class Employee {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'employee_code', length: 50, unique: true })
    employeeCode!: string;

    @Column({ name: 'first_name', length: 100 })
    firstName!: string;

    @Column({ name: 'last_name', length: 100 })
    lastName!: string;

    @Column({ length: 255, unique: true })
    email!: string;

    @Column({
        name: 'phone_number',
        type: 'varchar',
        length: 20,
        nullable: true,
    })
    phoneNumber!: string | null;

    @Column({ name: 'date_of_birth', type: 'date', nullable: true })
    dateOfBirth!: string | null;

    @Column({ type: 'varchar', length: 20, nullable: true })
    gender!: string | null;

    @Column({ name: 'hire_date', type: 'date' })
    hireDate!: string;

    @Column({ type: 'text', nullable: true })
    address!: string | null;

    @Index()
    @Column({
        type: 'enum',
        enum: EmployeeStatus,
        default: EmployeeStatus.Active,
    })
    status!: EmployeeStatus;

    @ManyToMany(() => Branch)
    @JoinTable({
        name: 'employee_branches',
        joinColumn: {
            name: 'employee_id',
            referencedColumnName: 'id',
        },
        inverseJoinColumn: {
            name: 'branch_id',
            referencedColumnName: 'id',
        },
    })
    branches!: Branch[];

    @ManyToMany(() => Position)
    @JoinTable({
        name: 'employee_positions',
        synchronize: false,
        joinColumn: {
            name: 'employee_id',
            referencedColumnName: 'id',
        },
        inverseJoinColumn: {
            name: 'position_id',
            referencedColumnName: 'id',
        },
    })
    positions!: Position[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
