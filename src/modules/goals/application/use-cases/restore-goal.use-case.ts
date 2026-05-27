import { Inject, Injectable } from '@nestjs/common';
import type { Goal } from '../../domain/entities/goal.entity';
import type { IGoalRepository } from '../../domain/ports/goal.repository';
import { GoalNotFoundError } from '../../domain/errors/goal-not-found.error';
import { GOAL_TOKENS } from '../../infrastructure/goal.tokens';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';

interface RestoreGoalCommand {
  id: string;
  userId: string;
}

@Injectable()
export class RestoreGoalUseCase {
  constructor(
    @Inject(GOAL_TOKENS.GOAL_REPOSITORY)
    private readonly goalRepo: IGoalRepository,
  ) {}

  async execute(command: RestoreGoalCommand): Promise<Goal> {
    const id = Uuid.from(command.id);
    const userId = Uuid.from(command.userId);

    const goal = await this.goalRepo.findByIdWithDeleted(id, userId);
    if (!goal) throw new GoalNotFoundError(command.id);

    goal.restore();
    await this.goalRepo.save(goal);
    return goal;
  }
}
