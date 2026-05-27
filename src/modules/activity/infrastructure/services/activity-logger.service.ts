import { Inject, Injectable } from '@nestjs/common';
import type {
  IActivityLogger,
  LogActivityCommand,
} from '../../application/ports/activity-logger';
import type { IActivityLogRepository } from '../../domain/ports/activity-log.repository';
import { ActivityLog } from '../../domain/entities/activity-log.entity';
import { ACTIVITY_TOKENS } from '../activity.tokens';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';

@Injectable()
export class ActivityLoggerService implements IActivityLogger {
  constructor(
    @Inject(ACTIVITY_TOKENS.ACTIVITY_LOG_REPOSITORY)
    private readonly repo: IActivityLogRepository,
  ) {}

  async log(command: LogActivityCommand): Promise<void> {
    const log = ActivityLog.create({
      userId: Uuid.from(command.userId),
      action: command.action,
      entity: command.entity,
      entityId: Uuid.from(command.entityId),
      metadata: command.metadata,
    });
    await this.repo.save(log);
  }
}
