import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  type JwtPayload,
} from '../../auth/presentation/decorators/current-user.decorator';
import { GetDashboardSummaryUseCase } from '../application/use-cases/get-dashboard-summary.use-case';
import { GetProgressTimelineUseCase } from '../application/use-cases/get-progress-timeline.use-case';
import { GetCalendarEventsUseCase } from '../application/use-cases/get-calendar-events.use-case';
import { GetUpcomingUseCase } from '../application/use-cases/get-upcoming.use-case';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly getSummaryUseCase: GetDashboardSummaryUseCase,
    private readonly getTimelineUseCase: GetProgressTimelineUseCase,
    private readonly getCalendarUseCase: GetCalendarEventsUseCase,
    private readonly getUpcomingUseCase: GetUpcomingUseCase,
  ) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Get dashboard summary with streak and category breakdown',
  })
  async summary(@CurrentUser() user: JwtPayload) {
    return this.getSummaryUseCase.execute({ userId: user.userId });
  }

  @Get('timeline')
  @ApiOperation({ summary: 'Get progress timeline data for charts' })
  @ApiQuery({ name: 'range', enum: ['week', 'month', 'year'], required: false })
  async timeline(
    @CurrentUser() user: JwtPayload,
    @Query('range') range?: string,
  ) {
    const validRange = (['week', 'month', 'year'] as const).includes(
      range as 'week' | 'month' | 'year',
    )
      ? (range as 'week' | 'month' | 'year')
      : 'week';

    return this.getTimelineUseCase.execute({
      userId: user.userId,
      range: validRange,
    });
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Get goals and steps with dates in a range' })
  @ApiQuery({
    name: 'from',
    required: true,
    type: String,
    description: 'ISO date string',
  })
  @ApiQuery({
    name: 'to',
    required: true,
    type: String,
    description: 'ISO date string',
  })
  async calendar(
    @CurrentUser() user: JwtPayload,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.getCalendarUseCase.execute({
      userId: user.userId,
      from: new Date(from),
      to: new Date(to),
    });
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming goals and steps ordered by end date' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async upcoming(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: string,
  ) {
    return this.getUpcomingUseCase.execute({
      userId: user.userId,
      limit: limit ? parseInt(limit, 10) : 10,
    });
  }
}
