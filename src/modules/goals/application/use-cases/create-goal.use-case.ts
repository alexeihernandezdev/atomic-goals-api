import { Inject, Injectable } from '@nestjs/common';
import { Goal } from '../../domain/entities/goal.entity';
import { GoalInstance } from '../../domain/entities/goal-instance.entity';
import { GoalType } from '../../domain/enums/goal-type.enum';
import type { IGoalRepository } from '../../domain/ports/goal.repository';
import type { IGoalInstanceRepository } from '../../domain/ports/goal-instance.repository';
import type { IClock } from '../../domain/ports/clock';
import type { IUnitOfWork } from '../../../../shared/application/ports/unit-of-work';
import { GOAL_TOKENS } from '../../infrastructure/goal.tokens';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';
import type { CyclePeriod } from '../../domain/enums/cycle-period.enum';
import { CONCLUSIVE_OPEN_CYCLE_END } from '../../domain/services/goal-derived-metrics';

interface CreateGoalCommand {
  userId: string;
  categoryId: string;
  name: string;
  description?: string;
  type: GoalType;
  cyclePeriod?: CyclePeriod;
  customCycleDays?: number;
}

interface CreateGoalResult {
  goal: Goal;
  instance: GoalInstance;
}

@Injectable()
export class CreateGoalUseCase {
  constructor(
    @Inject(GOAL_TOKENS.GOAL_REPOSITORY)
    private readonly goalRepo: IGoalRepository,
    @Inject(GOAL_TOKENS.GOAL_INSTANCE_REPOSITORY)
    private readonly instanceRepo: IGoalInstanceRepository,
    @Inject(GOAL_TOKENS.CLOCK)
    private readonly clock: IClock,
    @Inject(GOAL_TOKENS.UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(command: CreateGoalCommand): Promise<CreateGoalResult> {
    const userId = Uuid.from(command.userId);
    const categoryId = Uuid.from(command.categoryId);

    const goal = Goal.create({
      userId,
      categoryId,
      name: command.name,
      description: command.description,
      type: command.type,
      cyclePeriod: command.cyclePeriod,
      customCycleDays: command.customCycleDays,
    });

    const now = this.clock.now();
    const cycleStart = now;
    const cycleEnd =
      goal.type === GoalType.CYCLIC
        ? goal.nextCycleEnd(cycleStart)
        : CONCLUSIVE_OPEN_CYCLE_END;

    const instance = GoalInstance.create({
      goalId: goal.id,
      cycleStart,
      cycleEnd,
    });

    await this.unitOfWork.execute(async () => {
      await this.goalRepo.save(goal);
      await this.instanceRepo.save(instance);
    });

    return { goal, instance };
  }
}
