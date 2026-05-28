import { Inject, Injectable } from '@nestjs/common';
import type { ActivityLog } from '../../domain/entities/activity-log.entity';
import type { IActivityLogRepository } from '../../domain/ports/activity-log.repository';
import { ACTIVITY_TOKENS } from '../../infrastructure/activity.tokens';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';

interface ListUserActivityQuery {
  userId: string;
  limit?: number;
  cursor?: string;
}

function decodeCursor(cursor: string): Date {
  return new Date(Buffer.from(cursor, 'base64').toString('utf8'));
}

@Injectable()
export class ListUserActivityUseCase {
  constructor(
    @Inject(ACTIVITY_TOKENS.ACTIVITY_LOG_REPOSITORY)
    private readonly repo: IActivityLogRepository,
  ) {}

  async execute(query: ListUserActivityQuery): Promise<{
    items: ActivityLog[];
    nextCursor: string | null;
  }> {
    const limit = query.limit ?? 20;
    const before = query.cursor ? decodeCursor(query.cursor) : undefined;

    const items = await this.repo.findByUserId(Uuid.from(query.userId), {
      limit: limit + 1,
      before,
    });

    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;
    const nextCursor =
      hasMore && page.length > 0
        ? Buffer.from(page[page.length - 1].createdAt.toISOString()).toString(
            'base64',
          )
        : null;

    return { items: page, nextCursor };
  }
}
