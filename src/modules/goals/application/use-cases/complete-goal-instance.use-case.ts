import { Inject, Injectable } from '@nestjs/common';
import type { GoalInstance } from '../../domain/entities/goal-instance.entity';
import type { IGoalRepository } from '../../domain/ports/goal.repository';
import type { IGoalInstanceRepository } from '../../domain/ports/goal-instance.repository';
import { GoalInstanceNotFoundError } from '../../domain/errors/goal-instance-not-found.error';
import { GoalNotFoundError } from '../../domain/errors/goal-not-found.error';
import { GOAL_TOKENS } from '../../infrastructure/goal.tokens';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';
import { GoalType } from '../../domain/enums/goal-type.enum';
import { CloseAndCreateNextCycleUseCase } from './close-and-create-next-cycle.use-case';

interface CompleteGoalInstanceCommand {
  id: string;
  userId: string;
}

@Injectable()
export class CompleteGoalInstanceUseCase {
  constructor(
    @Inject(GOAL_TOKENS.GOAL_REPOSITORY)
    private readonly goalRepo: IGoalRepository,
    @Inject(GOAL_TOKENS.GOAL_INSTANCE_REPOSITORY)
    private readonly instanceRepo: IGoalInstanceRepository,
    private readonly closeAndCreateNextCycle: CloseAndCreateNextCycleUseCase,
  ) {}

  async execute(command: CompleteGoalInstanceCommand): Promise<GoalInstance> {
    const id = Uuid.from(command.id);
    const userId = Uuid.from(command.userId);

    const instance = await this.instanceRepo.findById(id);
    if (!instance) throw new GoalInstanceNotFoundError(command.id);

    const goal = await this.goalRepo.findById(instance.goalId, userId);
    if (!goal) throw new GoalNotFoundError(instance.goalId.value);

    if (goal.type === GoalType.CYCLIC) {
      instance.complete();
      return this.closeAndCreateNextCycle.execute({
        goal,
        activeInstance: instance,
      });
    }

    instance.complete();
    await this.instanceRepo.save(instance);
    return instance;
  }
}
