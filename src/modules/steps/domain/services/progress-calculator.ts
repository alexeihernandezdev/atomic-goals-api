import type { Step } from '../entities/step.entity';

export class ProgressCalculator {
  static calculate(steps: Step[]): number {
    if (steps.length === 0) return 0;
    const totalWeight = steps.reduce((sum, s) => sum + s.weight, 0);
    if (totalWeight === 0) return 0;
    const weightedSum = steps.reduce(
      (sum, s) => sum + s.progress() * s.weight,
      0,
    );
    return weightedSum / totalWeight;
  }
}
