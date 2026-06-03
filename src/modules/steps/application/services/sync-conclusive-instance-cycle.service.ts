import { Inject, Injectable } from '@nestjs/common';
import { GoalType } from '../../../goals/domain/enums/goal-type.enum';
import type { Goal } from '../../../goals/domain/entities/goal.entity';
import type { GoalInstance } from '../../../goals/domain/entities/goal-instance.entity';
import type { IGoalRepository } from '../../../goals/domain/ports/goal.repository';
import type { IGoalInstanceRepository } from '../../../goals/domain/ports/goal-instance.repository';
import { computeConclusiveInstanceCycleBounds } from '../../../goals/domain/services/goal-derived-metrics';
import { GOAL_TOKENS } from '../../../goals/infrastructure/goal.tokens';
import type { IStepRepository } from '../../domain/ports/step.repository';
import { STEP_TOKENS } from '../../infrastructure/step.tokens';

@Injectable()
export class SyncConclusiveInstanceCycleService {
  constructor(
    @Inject(STEP_TOKENS.STEP_REPOSITORY)
    private readonly stepRepo: IStepRepository,
    @Inject(GOAL_TOKENS.GOAL_REPOSITORY)
    private readonly goalRepo: IGoalRepository,
    @Inject(STEP_TOKENS.GOAL_INSTANCE_REPOSITORY)
    private readonly instanceRepo: IGoalInstanceRepository,
  ) {}

  async syncForInstance(instance: GoalInstance): Promise<void> {
    const goal = await this.goalRepo.findByIdInternal(instance.goalId);
    if (!goal) return;
    await this.sync(goal, instance);
  }

  async sync(goal: Goal, instance: GoalInstance): Promise<void> {
    if (goal.type !== GoalType.CONCLUSIVE) return;

    const steps = await this.stepRepo.findActiveByGoalInstanceId(instance.id);
    const { cycleStart, cycleEnd } = computeConclusiveInstanceCycleBounds(
      steps,
      instance.cycleStart,
    );

    if (
      instance.cycleStart.getTime() === cycleStart.getTime() &&
      instance.cycleEnd.getTime() === cycleEnd.getTime()
    ) {
      return;
    }

    instance.updateCycleBounds(cycleStart, cycleEnd);
    await this.instanceRepo.save(instance);
  }
}
