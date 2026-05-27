import { Inject, Injectable } from '@nestjs/common';
import type { Step } from '../../domain/entities/step.entity';
import { ProgressBarStep } from '../../domain/entities/progress-bar-step.entity';
import { CheckStep } from '../../domain/entities/check-step.entity';
import { StatusStep } from '../../domain/entities/status-step.entity';
import { CounterStep } from '../../domain/entities/counter-step.entity';
import type { IStepRepository } from '../../domain/ports/step.repository';
import type { IGoalInstanceRepository } from '../../../goals/domain/ports/goal-instance.repository';
import type { IUnitOfWork } from '../../../../shared/application/ports/unit-of-work';
import { ProgressCalculator } from '../../domain/services/progress-calculator';
import { StepNotFoundError } from '../../domain/errors/step-not-found.error';
import { InvalidStepConfigError } from '../../domain/errors/invalid-step-config.error';
import { GoalInstanceNotFoundError } from '../../../goals/domain/errors/goal-instance-not-found.error';
import { STEP_TOKENS } from '../../infrastructure/step.tokens';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';

interface UpdateStepProgressCommand {
  id: string;
  current?: number;
  done?: boolean;
  currentStatusId?: string;
}

@Injectable()
export class UpdateStepProgressUseCase {
  constructor(
    @Inject(STEP_TOKENS.STEP_REPOSITORY)
    private readonly stepRepo: IStepRepository,
    @Inject(STEP_TOKENS.GOAL_INSTANCE_REPOSITORY)
    private readonly instanceRepo: IGoalInstanceRepository,
    @Inject(STEP_TOKENS.UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(command: UpdateStepProgressCommand): Promise<Step> {
    const step = await this.stepRepo.findById(Uuid.from(command.id));
    if (!step) throw new StepNotFoundError(command.id);

    this.applyProgress(step, command);

    const instance = await this.instanceRepo.findById(step.goalInstanceId);
    if (!instance)
      throw new GoalInstanceNotFoundError(step.goalInstanceId.value);

    await this.unitOfWork.execute(async () => {
      await this.stepRepo.save(step);
      const allSteps = await this.stepRepo.findActiveByGoalInstanceId(
        step.goalInstanceId,
      );
      const updated = allSteps.map((s) =>
        s.id.value === step.id.value ? step : s,
      );
      instance.updateProgress(ProgressCalculator.calculate(updated));
      await this.instanceRepo.save(instance);
    });

    return step;
  }

  private applyProgress(step: Step, command: UpdateStepProgressCommand): void {
    if (command.current !== undefined) {
      if (step instanceof ProgressBarStep) {
        step.updateProgress(command.current);
      } else if (step instanceof CounterStep) {
        step.updateCurrent(command.current);
      } else {
        throw new InvalidStepConfigError(
          'current is only valid for PROGRESS_BAR and COUNTER steps',
        );
      }
    }
    if (command.done !== undefined) {
      if (step instanceof CheckStep) {
        step.setDone(command.done);
      } else {
        throw new InvalidStepConfigError('done is only valid for CHECK steps');
      }
    }
    if (command.currentStatusId !== undefined) {
      if (step instanceof StatusStep) {
        step.setCurrentStatus(command.currentStatusId);
      } else {
        throw new InvalidStepConfigError(
          'currentStatusId is only valid for STATUS steps',
        );
      }
    }
  }
}
