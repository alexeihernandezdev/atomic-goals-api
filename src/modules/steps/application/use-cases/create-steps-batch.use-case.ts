import { Inject, Injectable } from '@nestjs/common';
import type { Step } from '../../domain/entities/step.entity';
import type { IStepRepository } from '../../domain/ports/step.repository';
import type { IGoalInstanceRepository } from '../../../goals/domain/ports/goal-instance.repository';
import type { IUnitOfWork } from '../../../../shared/application/ports/unit-of-work';
import { ProgressCalculator } from '../../domain/services/progress-calculator';
import { SyncConclusiveInstanceCycleService } from '../services/sync-conclusive-instance-cycle.service';
import { StepFactory, type BuildStepCommand } from '../services/step-factory';
import { STEP_TOKENS } from '../../infrastructure/step.tokens';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';
import { GoalInstanceNotFoundError } from '../../../goals/domain/errors/goal-instance-not-found.error';
import { InvalidStepConfigError } from '../../domain/errors/invalid-step-config.error';

// Each item is a full step config (title already includes the day suffix, and
// its own cycleDay). `order` is assigned from baseOrder + index.
type CreateStepsBatchItem = Omit<BuildStepCommand, 'order'>;

interface CreateStepsBatchCommand {
  goalInstanceId: string;
  baseOrder: number;
  steps: CreateStepsBatchItem[];
}

/**
 * Creates several steps at once as a linked recurring group (one per day).
 * All steps share a generated cycleGroupId; progress is recalculated once.
 */
@Injectable()
export class CreateStepsBatchUseCase {
  constructor(
    @Inject(STEP_TOKENS.STEP_REPOSITORY)
    private readonly stepRepo: IStepRepository,
    @Inject(STEP_TOKENS.GOAL_INSTANCE_REPOSITORY)
    private readonly instanceRepo: IGoalInstanceRepository,
    @Inject(STEP_TOKENS.UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
    private readonly syncConclusiveCycle: SyncConclusiveInstanceCycleService,
  ) {}

  async execute(command: CreateStepsBatchCommand): Promise<Step[]> {
    if (command.steps.length === 0)
      throw new InvalidStepConfigError('At least one step is required');

    const goalInstanceId = Uuid.from(command.goalInstanceId);
    const instance = await this.instanceRepo.findById(goalInstanceId);
    if (!instance) throw new GoalInstanceNotFoundError(command.goalInstanceId);

    const cycleGroupId = Uuid.generate().value;
    const steps = command.steps.map((item, i) => {
      const step = StepFactory.build(
        { ...item, order: command.baseOrder + i },
        goalInstanceId,
      );
      step.assignCycleGroup(cycleGroupId);
      return step;
    });

    await this.unitOfWork.execute(async () => {
      for (const step of steps) {
        await this.stepRepo.save(step);
      }
      const allSteps =
        await this.stepRepo.findActiveByGoalInstanceId(goalInstanceId);
      instance.updateProgress(ProgressCalculator.calculate(allSteps));
      await this.instanceRepo.save(instance);
      await this.syncConclusiveCycle.syncForInstance(instance);
    });

    return steps;
  }
}
