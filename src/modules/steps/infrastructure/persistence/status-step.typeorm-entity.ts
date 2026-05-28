import { ChildEntity, Column } from 'typeorm';
import { StepOrmEntity } from './step.typeorm-entity';
import { StepType } from '../../domain/enums/step-type.enum';
import type { StatusOption } from '../../domain/value-objects/status-option.vo';

@ChildEntity(StepType.STATUS)
export class StatusStepOrmEntity extends StepOrmEntity {
  @Column({ type: 'jsonb' })
  statuses: StatusOption[];

  @Column({ type: 'varchar' })
  currentStatusId: string;
}
