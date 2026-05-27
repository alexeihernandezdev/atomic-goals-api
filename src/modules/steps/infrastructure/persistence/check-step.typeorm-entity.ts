import { ChildEntity, Column } from 'typeorm';
import { StepOrmEntity } from './step.typeorm-entity';
import { StepType } from '../../domain/enums/step-type.enum';

@ChildEntity(StepType.CHECK)
export class CheckStepOrmEntity extends StepOrmEntity {
  @Column({ type: 'boolean', default: false })
  done: boolean;
}
