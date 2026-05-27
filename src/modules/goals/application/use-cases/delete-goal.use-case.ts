import { Inject, Injectable } from '@nestjs/common';
import type { IGoalRepository } from '../../domain/ports/goal.repository';
import { GoalNotFoundError } from '../../domain/errors/goal-not-found.error';
import { GOAL_TOKENS } from '../../infrastructure/goal.tokens';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';

interface DeleteGoalCommand {
  id: string;
  userId: string;
}

@Injectable()
export class DeleteGoalUseCase {
  constructor(
    @Inject(GOAL_TOKENS.GOAL_REPOSITORY)
    private readonly goalRepo: IGoalRepository,
  ) {}

  async execute(command: DeleteGoalCommand): Promise<void> {
    const id = Uuid.from(command.id);
    const userId = Uuid.from(command.userId);

    const goal = await this.goalRepo.findById(id, userId);
    if (!goal) throw new GoalNotFoundError(command.id);

    goal.softDelete();
    await this.goalRepo.save(goal);
  }
}
