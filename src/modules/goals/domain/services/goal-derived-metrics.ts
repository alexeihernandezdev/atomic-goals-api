import type { Step } from '../../../steps/domain/entities/step.entity';

export interface GoalDerivedMetrics {
  startDate?: Date;
  endDate?: Date;
  estimatedDurationMinutes?: number;
}

export const CONCLUSIVE_OPEN_CYCLE_END = new Date(
  '9999-12-31T00:00:00.000Z',
);

export function computeGoalDerivedMetrics(steps: Step[]): GoalDerivedMetrics {
  let startDate: Date | undefined;
  let endDate: Date | undefined;
  let durationSum = 0;
  let hasDuration = false;

  for (const step of steps) {
    if (step.startDate) {
      if (!startDate || step.startDate < startDate) {
        startDate = step.startDate;
      }
    }
    if (step.endDate) {
      if (!endDate || step.endDate > endDate) {
        endDate = step.endDate;
      }
    }
    if (step.estimatedDurationMinutes != null) {
      durationSum += step.estimatedDurationMinutes;
      hasDuration = true;
    }
  }

  return {
    startDate,
    endDate,
    estimatedDurationMinutes: hasDuration ? durationSum : undefined,
  };
}

export function computeConclusiveInstanceCycleBounds(
  steps: Step[],
  fallbackStart: Date,
): { cycleStart: Date; cycleEnd: Date } {
  const metrics = computeGoalDerivedMetrics(steps);
  return {
    cycleStart: metrics.startDate ?? fallbackStart,
    cycleEnd: metrics.endDate ?? CONCLUSIVE_OPEN_CYCLE_END,
  };
}
