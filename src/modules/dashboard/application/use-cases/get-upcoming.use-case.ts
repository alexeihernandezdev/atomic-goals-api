import { Inject, Injectable } from '@nestjs/common';
import type {
  IDashboardReadModel,
  UpcomingItem,
} from '../ports/dashboard-read-model';
import { DASHBOARD_TOKENS } from '../../infrastructure/dashboard.tokens';

@Injectable()
export class GetUpcomingUseCase {
  constructor(
    @Inject(DASHBOARD_TOKENS.READ_MODEL)
    private readonly readModel: IDashboardReadModel,
  ) {}

  async execute(query: {
    userId: string;
    limit?: number;
  }): Promise<UpcomingItem[]> {
    return this.readModel.getUpcoming(query.userId, query.limit ?? 10);
  }
}
