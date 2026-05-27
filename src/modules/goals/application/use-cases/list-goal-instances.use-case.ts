import { Inject, Injectable } from '@nestjs/common';
import type { GoalInstance } from '../../domain/entities/goal-instance.entity';
import type { IGoalRepository } from '../../domain/ports/goal.repository';
import type { IGoalInstanceRepository } from '../../domain/ports/goal-instance.repository';
import { GoalNotFoundError } from '../../domain/errors/goal-not-found.error';
import { GOAL_TOKENS } from '../../infrastructure/goal.tokens';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';

interface ListGoalInstancesQuery {
  goalId: string;
  userId: string;
}

@Injectable()
export class ListGoalInstancesUseCase {
  constructor(
    @Inject(GOAL_TOKENS.GOAL_REPOSITORY)
    private readonly goalRepo: IGoalRepository,
    @Inject(GOAL_TOKENS.GOAL_INSTANCE_REPOSITORY)
    private readonly instanceRepo: IGoalInstanceRepository,
  ) {}

  async execute(query: ListGoalInstancesQuery): Promise<GoalInstance[]> {
    const goalId = Uuid.from(query.goalId);
    const userId = Uuid.from(query.userId);

    const goal = await this.goalRepo.findById(goalId, userId);
    if (!goal) throw new GoalNotFoundError(query.goalId);

    return this.instanceRepo.findByGoalId(goal.id);
  }
}
