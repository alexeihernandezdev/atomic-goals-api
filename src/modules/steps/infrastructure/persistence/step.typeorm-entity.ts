import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  TableInheritance,
  UpdateDateColumn,
} from 'typeorm';

@Entity('steps')
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
@Index('IDX_steps_goalInstanceId', ['goalInstanceId'])
export class StepOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  goalInstanceId: string;

  @Column({ type: 'varchar' })
  type: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'varchar', nullable: true })
  description: string | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 1 })
  weight: number;

  @Column({ type: 'integer', default: 0 })
  order: number;

  @Column({ type: 'varchar', nullable: true })
  unit: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  startDate: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  endDate: Date | null;

  @Column({ type: 'integer', nullable: true })
  estimatedDurationMinutes: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
