import { Inject, Injectable } from '@nestjs/common';
import type { GoalInstance } from '../../domain/entities/goal-instance.entity';
import type { IGoalInstanceRepository } from '../../domain/ports/goal-instance.repository';
import { GoalInstanceNotFoundError } from '../../domain/errors/goal-instance-not-found.error';
import { GOAL_TOKENS } from '../../infrastructure/goal.tokens';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';

interface GetGoalInstanceQuery {
  id: string;
}

@Injectable()
export class GetGoalInstanceUseCase {
  constructor(
    @Inject(GOAL_TOKENS.GOAL_INSTANCE_REPOSITORY)
    private readonly instanceRepo: IGoalInstanceRepository,
  ) {}

  async execute(query: GetGoalInstanceQuery): Promise<GoalInstance> {
    const id = Uuid.from(query.id);
    const instance = await this.instanceRepo.findById(id);
    if (!instance) throw new GoalInstanceNotFoundError(query.id);
    return instance;
  }
}
