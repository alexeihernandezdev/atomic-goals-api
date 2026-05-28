import { Inject, Injectable } from '@nestjs/common';
import type { IStepRepository } from '../../domain/ports/step.repository';
import type { IGoalInstanceRepository } from '../../../goals/domain/ports/goal-instance.repository';
import type { IUnitOfWork } from '../../../../shared/application/ports/unit-of-work';
import { ProgressCalculator } from '../../domain/services/progress-calculator';
import { StepNotFoundError } from '../../domain/errors/step-not-found.error';
import { GoalInstanceNotFoundError } from '../../../goals/domain/errors/goal-instance-not-found.error';
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
  ) {}

  async execute(command: { id: string }): Promise<void> {
    const step = await this.stepRepo.findById(Uuid.from(command.id));
    if (!step) throw new StepNotFoundError(command.id);

    const instance = await this.instanceRepo.findById(step.goalInstanceId);
    if (!instance)
      throw new GoalInstanceNotFoundError(step.goalInstanceId.value);

    step.softDelete();

    await this.unitOfWork.execute(async () => {
      await this.stepRepo.save(step);
      const remaining = await this.stepRepo.findActiveByGoalInstanceId(
        step.goalInstanceId,
      );
      instance.updateProgress(ProgressCalculator.calculate(remaining));
      await this.instanceRepo.save(instance);
    });
  }
}
