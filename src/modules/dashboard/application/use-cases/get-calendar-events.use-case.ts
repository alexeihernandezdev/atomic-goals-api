import { Inject, Injectable } from '@nestjs/common';
import type {
  IDashboardReadModel,
  CalendarEvent,
} from '../ports/dashboard-read-model';
import { DASHBOARD_TOKENS } from '../../infrastructure/dashboard.tokens';

@Injectable()
export class GetCalendarEventsUseCase {
  constructor(
    @Inject(DASHBOARD_TOKENS.READ_MODEL)
    private readonly readModel: IDashboardReadModel,
  ) {}

  async execute(query: {
    userId: string;
    from: Date;
    to: Date;
  }): Promise<CalendarEvent[]> {
    return this.readModel.getCalendarEvents(query.userId, query.from, query.to);
  }
}
