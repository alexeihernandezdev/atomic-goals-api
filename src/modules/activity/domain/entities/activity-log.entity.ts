import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';
import type { ActivityAction } from '../enums/activity-action.enum';
import type { ActivityEntity } from '../enums/activity-entity.enum';

interface CreateActivityLogProps {
  userId: Uuid;
  action: ActivityAction;
  entity: ActivityEntity;
  entityId: Uuid;
  metadata?: Record<string, unknown>;
}

interface ReconstituteActivityLogProps {
  id: Uuid;
  userId: Uuid;
  action: ActivityAction;
  entity: ActivityEntity;
  entityId: Uuid;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export class ActivityLog {
  private constructor(
    public readonly id: Uuid,
    public readonly userId: Uuid,
    public readonly action: ActivityAction,
    public readonly entity: ActivityEntity,
    public readonly entityId: Uuid,
    public readonly metadata: Record<string, unknown>,
    public readonly createdAt: Date,
  ) {}

  static create(props: CreateActivityLogProps): ActivityLog {
    return new ActivityLog(
      Uuid.generate(),
      props.userId,
      props.action,
      props.entity,
      props.entityId,
      props.metadata ?? {},
      new Date(),
    );
  }

  static reconstitute(props: ReconstituteActivityLogProps): ActivityLog {
    return new ActivityLog(
      props.id,
      props.userId,
      props.action,
      props.entity,
      props.entityId,
      props.metadata,
      props.createdAt,
    );
  }
}
