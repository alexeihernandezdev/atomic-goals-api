import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('activity_logs')
@Index('IDX_activity_logs_userId_createdAt', ['userId', 'createdAt'])
export class ActivityLogOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar' })
  action: string;

  @Column({ type: 'varchar' })
  entity: string;

  @Column({ type: 'uuid' })
  entityId: string;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;
}
