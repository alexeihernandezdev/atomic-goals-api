import { Inject, Injectable } from '@nestjs/common';
import type { IStepRepository } from '../../domain/ports/step.repository';
import type { IGoalInstanceRepository } from '../../../goals/domain/ports/goal-instance.repository';
import type { IUnitOfWork } from '../../../../shared/application/ports/unit-of-work';
import { ProgressCalculator } from '../../domain/services/progress-calculator';
import { StepNotFoundError } from '../../domain/errors/step-not-found.error';
import { GoalInstanceNotFoundError } from '../../../goals/domain/errors/goal-instance-not-found.error';
import { SyncConclusiveInstanceCycleService } from '../services/sync-conclusive-instance-cycle.service';
import { STEP_TOKENS } from '../../infrastructure/step.tokens';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';

@Injectable()
export class DeleteStepUseCase {
  constructor(
    @Inject(STEP_TOKENS.STEP_REPOSITORY)
    private readonly stepRepo: IStepRepository,
    @Inject(STEP_TOKENS.GOAL_INSTANCE_REPOSITORY)
    private readonly instanceRepo: IGoalInstanceRepository,
    @Inject(STEP_TOKENS.UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
    private readonly syncConclusiveCycle: SyncConclusiveInstanceCycleService,
  ) {}

  async execute(command: { id: string }): Promise<void> {
    const step = await this.stepRepo.findById(Uuid.from(command.id));
    if (!step) throw new StepNotFoundError(command.id);

    const instance = await this.instanceRepo.findById(step.goalInstanceId);
    if (!instance)
      throw new GoalInstanceNotFoundError(step.goalInstanceId.value);

    // Recurring steps created together share a cycleGroupId: deleting one
    // removes the whole group.
    const active = await this.stepRepo.findActiveByGoalInstanceId(
      step.goalInstanceId,
    );
    const toDelete = step.cycleGroupId
      ? active.filter((s) => s.cycleGroupId === step.cycleGroupId)
      : [step];
    // Ensure the target step is included even if not present in the active list.
    if (!toDelete.some((s) => s.id.value === step.id.value)) {
      toDelete.push(step);
    }

    await this.unitOfWork.execute(async () => {
      for (const s of toDelete) {
        s.softDelete();
        await this.stepRepo.save(s);
      }
      const remaining = await this.stepRepo.findActiveByGoalInstanceId(
        step.goalInstanceId,
      );
      instance.updateProgress(ProgressCalculator.calculate(remaining));
      await this.instanceRepo.save(instance);
      await this.syncConclusiveCycle.syncForInstance(instance);
    });
  }
}
