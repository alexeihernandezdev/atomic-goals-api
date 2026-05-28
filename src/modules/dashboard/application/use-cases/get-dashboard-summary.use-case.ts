import { Inject, Injectable } from '@nestjs/common';
import type { IDashboardReadModel } from '../ports/dashboard-read-model';
import { StreakCalculator } from '../../domain/services/streak-calculator';
import { DASHBOARD_TOKENS } from '../../infrastructure/dashboard.tokens';

@Injectable()
export class GetDashboardSummaryUseCase {
  constructor(
    @Inject(DASHBOARD_TOKENS.READ_MODEL)
    private readonly readModel: IDashboardReadModel,
  ) {}

  async execute(query: { userId: string }) {
    const [summaryData, cyclicInstances] = await Promise.all([
      this.readModel.getSummaryData(query.userId),
      this.readModel.getCompletedCyclicInstances(query.userId),
    ]);

    const currentStreak = StreakCalculator.calculate(cyclicInstances);

    return { ...summaryData, currentStreak };
  }
}
