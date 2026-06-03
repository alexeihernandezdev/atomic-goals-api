import type { GoalDerivedMetrics } from '../../../goals/domain/services/goal-derived-metrics';
import type { Step } from '../entities/step.entity';
import type { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';

export interface IStepRepository {
  findById(id: Uuid): Promise<Step | null>;
  findByGoalInstanceId(goalInstanceId: Uuid): Promise<Step[]>;
  findActiveByGoalInstanceId(goalInstanceId: Uuid): Promise<Step[]>;
  findDerivedMetricsByGoalInstanceIds(
    goalInstanceIds: Uuid[],
  ): Promise<Map<string, GoalDerivedMetrics>>;
  save(step: Step): Promise<void>;
}
