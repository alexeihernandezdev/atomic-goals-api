import type { Goal } from '../entities/goal.entity';
import type { GoalType } from '../enums/goal-type.enum';
import type { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';

export interface GoalFilters {
  categoryId?: Uuid;
  type?: GoalType;
  includeDeleted?: boolean;
  page?: number;
  limit?: number;
}

export interface IGoalRepository {
  findById(id: Uuid, userId: Uuid): Promise<Goal | null>;
  findByIdWithDeleted(id: Uuid, userId: Uuid): Promise<Goal | null>;
  findAllByUser(userId: Uuid, filters?: GoalFilters): Promise<Goal[]>;
  save(goal: Goal): Promise<void>;
}
