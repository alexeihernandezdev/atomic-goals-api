import type { ActivityLog } from '../entities/activity-log.entity';
import type { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';

export interface FindActivityOptions {
  limit?: number;
  before?: Date;
}

export interface IActivityLogRepository {
  findByUserId(
    userId: Uuid,
    options?: FindActivityOptions,
  ): Promise<ActivityLog[]>;
  save(log: ActivityLog): Promise<void>;
}
