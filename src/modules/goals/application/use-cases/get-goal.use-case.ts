import { Inject, Injectable } from '@nestjs/common';
import type { Goal } from '../../domain/entities/goal.entity';
import type { GoalInstance } from '../../domain/entities/goal-instance.entity';
import type { IGoalRepository } from '../../domain/ports/goal.repository';
import type { IGoalInstanceRepository } from '../../domain/ports/goal-instance.repository';
import type { IClock } from '../../domain/ports/clock';
import { GoalNotFoundError } from '../../domain/errors/goal-not-found.error';
import { GOAL_TOKENS } from '../../infrastructure/goal.tokens';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';
import { CloseAndCreateNextCycleUseCase } from './close-and-create-next-cycle.use-case';

interface GetGoalQuery {
  id: string;
  userId: string;
}

interface GetGoalResult {
  goal: Goal;
  activeInstance: GoalInstance | null;
}

@Injectable()
export class GetGoalUseCase {
  constructor(
    @Inject(GOAL_TOKENS.GOAL_REPOSITORY)
    private readonly goalRepo: IGoalRepository,
    @Inject(GOAL_TOKENS.GOAL_INSTANCE_REPOSITORY)
    private readonly instanceRepo: IGoalInstanceRepository,
    @Inject(GOAL_TOKENS.CLOCK)
    private readonly clock: IClock,
    private readonly closeAndCreateNextCycle: CloseAndCreateNextCycleUseCase,
  ) {}

  async execute(query: GetGoalQuery): Promise<GetGoalResult> {
    const id = Uuid.from(query.id);
    const userId = Uuid.from(query.userId);

    const goal = await this.goalRepo.findById(id, userId);
    if (!goal) throw new GoalNotFoundError(query.id);

    let activeInstance = await this.instanceRepo.findActiveByGoalId(goal.id);

    if (
      activeInstance &&
      goal.shouldCloseCurrentCycle(activeInstance.cycleEnd, this.clock.now())
    ) {
      activeInstance = await this.closeAndCreateNextCycle.execute({
        goal,
        activeInstance,
      });
    }

    return { goal, activeInstance };
  }
}
