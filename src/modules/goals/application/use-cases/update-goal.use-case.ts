import { Inject, Injectable } from '@nestjs/common';
import type { Goal } from '../../domain/entities/goal.entity';
import type { IGoalRepository } from '../../domain/ports/goal.repository';
import type { CyclePeriod } from '../../domain/enums/cycle-period.enum';
import { GoalNotFoundError } from '../../domain/errors/goal-not-found.error';
import { GOAL_TOKENS } from '../../infrastructure/goal.tokens';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';

interface UpdateGoalCommand {
  id: string;
  userId: string;
  name?: string;
  description?: string;
  categoryId?: string;
  cyclePeriod?: CyclePeriod;
  customCycleDays?: number;
  startDate?: Date;
  endDate?: Date;
  estimatedDurationMinutes?: number;
}

@Injectable()
export class UpdateGoalUseCase {
  constructor(
    @Inject(GOAL_TOKENS.GOAL_REPOSITORY)
    private readonly goalRepo: IGoalRepository,
  ) {}

  async execute(command: UpdateGoalCommand): Promise<Goal> {
    const id = Uuid.from(command.id);
    const userId = Uuid.from(command.userId);

    const goal = await this.goalRepo.findById(id, userId);
    if (!goal) throw new GoalNotFoundError(command.id);

    goal.update({
      name: command.name,
      description: command.description,
      categoryId: command.categoryId
        ? Uuid.from(command.categoryId)
        : undefined,
      cyclePeriod: command.cyclePeriod,
      customCycleDays: command.customCycleDays,
      startDate: command.startDate,
      endDate: command.endDate,
      estimatedDurationMinutes: command.estimatedDurationMinutes,
    });

    await this.goalRepo.save(goal);
    return goal;
  }
}
