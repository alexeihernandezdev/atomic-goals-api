import { Inject, Injectable } from '@nestjs/common';
import type { Goal } from '../../domain/entities/goal.entity';
import type { GoalInstance } from '../../domain/entities/goal-instance.entity';
import type { IGoalRepository } from '../../domain/ports/goal.repository';
import type { IGoalInstanceRepository } from '../../domain/ports/goal-instance.repository';
import type { GoalType } from '../../domain/enums/goal-type.enum';
import { GOAL_TOKENS } from '../../infrastructure/goal.tokens';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';

interface ListGoalsQuery {
  userId: string;
  categoryId?: string;
  type?: GoalType;
  includeDeleted?: boolean;
  page?: number;
  limit?: number;
}

export interface GoalWithActiveInstance {
  goal: Goal;
  activeInstance: GoalInstance | null;
}

@Injectable()
export class ListGoalsUseCase {
  constructor(
    @Inject(GOAL_TOKENS.GOAL_REPOSITORY)
    private readonly goalRepo: IGoalRepository,
    @Inject(GOAL_TOKENS.GOAL_INSTANCE_REPOSITORY)
    private readonly instanceRepo: IGoalInstanceRepository,
  ) {}

  async execute(query: ListGoalsQuery): Promise<GoalWithActiveInstance[]> {
    const userId = Uuid.from(query.userId);
    const goals = await this.goalRepo.findAllByUser(userId, {
      categoryId: query.categoryId ? Uuid.from(query.categoryId) : undefined,
      type: query.type,
      includeDeleted: query.includeDeleted,
      page: query.page,
      limit: query.limit,
    });

    const instances = await this.instanceRepo.findActiveManyByGoalIds(
      goals.map((g) => g.id),
    );
    const instanceByGoalId = new Map(instances.map((i) => [i.goalId.value, i]));

    return goals.map((goal) => ({
      goal,
      activeInstance: instanceByGoalId.get(goal.id.value) ?? null,
    }));
  }
}
