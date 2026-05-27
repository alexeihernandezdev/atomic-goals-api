import type { ActivityAction } from '../../domain/enums/activity-action.enum';
import type { ActivityEntity } from '../../domain/enums/activity-entity.enum';

export interface LogActivityCommand {
  userId: string;
  action: ActivityAction;
  entity: ActivityEntity;
  entityId: string;
  metadata?: Record<string, unknown>;
}

export interface IActivityLogger {
  log(command: LogActivityCommand): Promise<void>;
}
