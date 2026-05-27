import { Inject, Injectable } from '@nestjs/common';
import type {
  IDashboardReadModel,
  TimelinePoint,
} from '../ports/dashboard-read-model';
import { DASHBOARD_TOKENS } from '../../infrastructure/dashboard.tokens';

@Injectable()
export class GetProgressTimelineUseCase {
  constructor(
    @Inject(DASHBOARD_TOKENS.READ_MODEL)
    private readonly readModel: IDashboardReadModel,
  ) {}

  async execute(query: {
    userId: string;
    range: 'week' | 'month' | 'year';
  }): Promise<TimelinePoint[]> {
    return this.readModel.getTimeline(query.userId, query.range);
  }
}
