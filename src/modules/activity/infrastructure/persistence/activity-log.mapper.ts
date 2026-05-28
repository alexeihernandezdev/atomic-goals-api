import { ActivityLog } from '../../domain/entities/activity-log.entity';
import type { ActivityAction } from '../../domain/enums/activity-action.enum';
import type { ActivityEntity } from '../../domain/enums/activity-entity.enum';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';
import { ActivityLogOrmEntity } from './activity-log.typeorm-entity';

export class ActivityLogMapper {
  static toDomain(orm: ActivityLogOrmEntity): ActivityLog {
    return ActivityLog.reconstitute({
      id: Uuid.from(orm.id),
      userId: Uuid.from(orm.userId),
      action: orm.action as ActivityAction,
      entity: orm.entity as ActivityEntity,
      entityId: Uuid.from(orm.entityId),
      metadata: orm.metadata,
      createdAt: orm.createdAt,
    });
  }

  static toPersistence(domain: ActivityLog): ActivityLogOrmEntity {
    const orm = new ActivityLogOrmEntity();
    orm.id = domain.id.value;
    orm.userId = domain.userId.value;
    orm.action = domain.action;
    orm.entity = domain.entity;
    orm.entityId = domain.entityId.value;
    orm.metadata = domain.metadata;
    orm.createdAt = domain.createdAt;
    return orm;
  }
}
