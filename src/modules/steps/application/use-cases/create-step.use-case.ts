import { Inject, Injectable } from '@nestjs/common';
import { StepType } from '../../domain/enums/step-type.enum';
import type { Step } from '../../domain/entities/step.entity';
import { ProgressBarStep } from '../../domain/entities/progress-bar-step.entity';
import { CheckStep } from '../../domain/entities/check-step.entity';
import { StatusStep } from '../../domain/entities/status-step.entity';
import { CounterStep } from '../../domain/entities/counter-step.entity';
import type { IStepRepository } from '../../domain/ports/step.repository';
import type { IGoalInstanceRepository } from '../../../goals/domain/ports/goal-instance.repository';
import type { IUnitOfWork } from '../../../../shared/application/ports/unit-of-work';
import { ProgressCalculator } from '../../domain/services/progress-calculator';
import { STEP_TOKENS } from '../../infrastructure/step.tokens';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';
import { GoalInstanceNotFoundError } from '../../../goals/domain/errors/goal-instance-not-found.error';
import { InvalidStepConfigError } from '../../domain/errors/invalid-step-config.error';
import type { StatusOption } from '../../domain/value-objects/status-option.vo';

interface CreateStepCommand {
  goalInstanceId: string;
  type: StepType;
  title: string;
  description?: string;
  weight?: number;
  order: number;
  unit?: string;
  // ProgressBar
  current?: number;
  target?: number;
  // Counter
  max?: number;
  min?: number;
  // Check
  done?: boolean;
  // Status
  statuses?: StatusOption[];
  currentStatusId?: string;
  startDate?: Date;
  endDate?: Date;
  estimatedDurationMinutes?: number;
}

@Injectable()
export class CreateStepUseCase {
  constructor(
    @Inject(STEP_TOKENS.STEP_REPOSITORY)
    private readonly stepRepo: IStepRepository,
    @Inject(STEP_TOKENS.GOAL_INSTANCE_REPOSITORY)
    private readonly instanceRepo: IGoalInstanceRepository,
    @Inject(STEP_TOKENS.UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(command: CreateStepCommand): Promise<Step> {
    const goalInstanceId = Uuid.from(command.goalInstanceId);
    const instance = await this.instanceRepo.findById(goalInstanceId);
    if (!instance) throw new GoalInstanceNotFoundError(command.goalInstanceId);

    const step = this.buildStep(command, goalInstanceId);

    await this.unitOfWork.execute(async () => {
      await this.stepRepo.save(step);
      const allSteps =
        await this.stepRepo.findActiveByGoalInstanceId(goalInstanceId);
      // include the new step in the calculation
      const combined = [
        ...allSteps.filter((s) => s.id.value !== step.id.value),
        step,
      ];
      const newProgress = ProgressCalculator.calculate(combined);
      instance.updateProgress(newProgress);
      await this.instanceRepo.save(instance);
    });

    return step;
  }

  private buildStep(command: CreateStepCommand, goalInstanceId: Uuid): Step {
    const base = {
      goalInstanceId,
      title: command.title,
      description: command.description,
      weight: command.weight,
      order: command.order,
      startDate: command.startDate,
      endDate: command.endDate,
      estimatedDurationMinutes: command.estimatedDurationMinutes,
    };

    switch (command.type) {
      case StepType.PROGRESS_BAR:
        if (command.target === undefined)
          throw new InvalidStepConfigError(
            'target is required for PROGRESS_BAR steps',
          );
        return ProgressBarStep.create({
          ...base,
          target: command.target,
          current: command.current,
          unit: command.unit,
        });
      case StepType.CHECK:
        return CheckStep.create({ ...base, done: command.done });
      case StepType.STATUS:
        if (!command.statuses || !command.currentStatusId)
          throw new InvalidStepConfigError(
            'statuses and currentStatusId are required for STATUS steps',
          );
        return StatusStep.create({
          ...base,
          statuses: command.statuses,
          currentStatusId: command.currentStatusId,
        });
      case StepType.COUNTER:
        if (command.max === undefined)
          throw new InvalidStepConfigError('max is required for COUNTER steps');
        return CounterStep.create({
          ...base,
          max: command.max,
          min: command.min,
          current: command.current,
          unit: command.unit,
        });
    }
  }
}
