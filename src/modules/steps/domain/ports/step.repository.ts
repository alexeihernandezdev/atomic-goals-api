import type { Step } from '../entities/step.entity';
import type { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';

export interface IStepRepository {
  findById(id: Uuid): Promise<Step | null>;
  findByGoalInstanceId(goalInstanceId: Uuid): Promise<Step[]>;
  findActiveByGoalInstanceId(goalInstanceId: Uuid): Promise<Step[]>;
  save(step: Step): Promise<void>;
}
