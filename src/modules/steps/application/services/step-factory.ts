import { StepType } from '../../domain/enums/step-type.enum';
import type { Step } from '../../domain/entities/step.entity';
import { ProgressBarStep } from '../../domain/entities/progress-bar-step.entity';
import { CheckStep } from '../../domain/entities/check-step.entity';
import { StatusStep } from '../../domain/entities/status-step.entity';
import { CounterStep } from '../../domain/entities/counter-step.entity';
import { InvalidStepConfigError } from '../../domain/errors/invalid-step-config.error';
import type { StatusOption } from '../../domain/value-objects/status-option.vo';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';

export interface BuildStepCommand {
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
  cycleDay?: string;
  estimatedDurationMinutes?: number;
}

/**
 * Builds the right Step subtype from a command. Shared by single-create and
 * batch-create use-cases so the per-type construction logic lives in one place.
 */
export class StepFactory {
  static build(command: BuildStepCommand, goalInstanceId: Uuid): Step {
    const base = {
      goalInstanceId,
      title: command.title,
      description: command.description,
      weight: command.weight,
      order: command.order,
      startDate: command.startDate,
      endDate: command.endDate,
      cycleDay: command.cycleDay,
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
