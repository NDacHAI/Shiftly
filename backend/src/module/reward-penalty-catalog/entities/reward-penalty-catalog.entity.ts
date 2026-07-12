import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { RewardPenaltyCategory } from './reward-penalty-category.enum';
import { RewardPenaltyStatus } from './reward-penalty-status.enum';

@Entity('reward_penalty_catalogs')
export class RewardPenaltyCatalog {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index({ unique: true })
    @Column({ type: 'varchar', length: 50 })
    code!: string;

    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Index()
    @Column({
        type: 'tinyint',
    })
    category!: RewardPenaltyCategory;

    @Column({
        type: 'decimal',
        precision: 12,
        scale: 2,
    })
    amount!: string;

    @Column({ type: 'text', nullable: true })
    description!: string | null;

    @Index()
    @Column({
        type: 'tinyint',
        default: RewardPenaltyStatus.Active,
    })
    status!: RewardPenaltyStatus;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
