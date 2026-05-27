import { Inject, Injectable } from '@nestjs/common';
import { GoalInstance } from '../../domain/entities/goal-instance.entity';
import type { Goal } from '../../domain/entities/goal.entity';
import type { IGoalInstanceRepository } from '../../domain/ports/goal-instance.repository';
import type { IUnitOfWork } from '../../../../shared/application/ports/unit-of-work';
import { GOAL_TOKENS } from '../../infrastructure/goal.tokens';

interface CloseAndCreateNextCycleCommand {
  goal: Goal;
  activeInstance: GoalInstance;
}

@Injectable()
export class CloseAndCreateNextCycleUseCase {
  constructor(
    @Inject(GOAL_TOKENS.GOAL_INSTANCE_REPOSITORY)
    private readonly instanceRepo: IGoalInstanceRepository,
    @Inject(GOAL_TOKENS.UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(
    command: CloseAndCreateNextCycleCommand,
  ): Promise<GoalInstance> {
    const { goal, activeInstance } = command;

    const closedStatus = activeInstance.progress >= 100 ? 'complete' : 'fail';

    const newCycleStart = activeInstance.cycleEnd;
    const newCycleEnd = goal.nextCycleEnd(newCycleStart);

    const newInstance = GoalInstance.create({
      goalId: goal.id,
      cycleStart: newCycleStart,
      cycleEnd: newCycleEnd,
    });

    await this.unitOfWork.execute(async () => {
      if (closedStatus === 'complete') {
        activeInstance.complete();
      } else {
        activeInstance.fail();
      }
      await this.instanceRepo.save(activeInstance);
      await this.instanceRepo.save(newInstance);
    });

    return newInstance;
  }
}
