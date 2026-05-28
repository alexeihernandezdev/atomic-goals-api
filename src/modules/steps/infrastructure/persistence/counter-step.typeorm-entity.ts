import { ChildEntity, Column } from 'typeorm';
import { StepOrmEntity } from './step.typeorm-entity';
import { StepType } from '../../domain/enums/step-type.enum';

@ChildEntity(StepType.COUNTER)
export class CounterStepOrmEntity extends StepOrmEntity {
  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  current: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  max: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  min: number;
}
