import { Inject, Injectable } from '@nestjs/common';
import type { Goal } from '../../domain/entities/goal.entity';
import type { IGoalRepository } from '../../domain/ports/goal.repository';
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

@Injectable()
export class ListGoalsUseCase {
  constructor(
    @Inject(GOAL_TOKENS.GOAL_REPOSITORY)
    private readonly goalRepo: IGoalRepository,
  ) {}

  async execute(query: ListGoalsQuery): Promise<Goal[]> {
    const userId = Uuid.from(query.userId);
    return this.goalRepo.findAllByUser(userId, {
      categoryId: query.categoryId ? Uuid.from(query.categoryId) : undefined,
      type: query.type,
      includeDeleted: query.includeDeleted,
      page: query.page,
      limit: query.limit,
    });
  }
}
