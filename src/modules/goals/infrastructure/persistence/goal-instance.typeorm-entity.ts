import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('goal_instances')
@Index('IDX_goal_instances_goalId', ['goalId'])
export class GoalInstanceOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  goalId: string;

  @Column({ type: 'timestamptz' })
  cycleStart: Date;

  @Column({ type: 'timestamptz' })
  cycleEnd: Date;

  @Column({ type: 'varchar', default: 'IN_PROGRESS' })
  status: string;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  progress: number;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
