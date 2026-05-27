import type { GoalInstance } from '../entities/goal-instance.entity';
import type { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';

export interface IGoalInstanceRepository {
  findById(id: Uuid): Promise<GoalInstance | null>;
  findByGoalId(goalId: Uuid): Promise<GoalInstance[]>;
  findActiveByGoalId(goalId: Uuid): Promise<GoalInstance | null>;
  save(instance: GoalInstance): Promise<void>;
}
