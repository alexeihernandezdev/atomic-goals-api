import { Module } from '@nestjs/common';
import { GetDashboardSummaryUseCase } from './application/use-cases/get-dashboard-summary.use-case';
import { GetProgressTimelineUseCase } from './application/use-cases/get-progress-timeline.use-case';
import { GetCalendarEventsUseCase } from './application/use-cases/get-calendar-events.use-case';
import { GetUpcomingUseCase } from './application/use-cases/get-upcoming.use-case';
import { DASHBOARD_TOKENS } from './infrastructure/dashboard.tokens';
import { DashboardTypeOrmReadModel } from './infrastructure/read-model/dashboard.typeorm-read-model';
import { DashboardController } from './presentation/dashboard.controller';

@Module({
  controllers: [DashboardController],
  providers: [
    GetDashboardSummaryUseCase,
    GetProgressTimelineUseCase,
    GetCalendarEventsUseCase,
    GetUpcomingUseCase,
    {
      provide: DASHBOARD_TOKENS.READ_MODEL,
      useClass: DashboardTypeOrmReadModel,
    },
  ],
})
export class DashboardModule {}
