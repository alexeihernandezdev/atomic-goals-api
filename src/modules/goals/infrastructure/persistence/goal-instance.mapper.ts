import { GoalInstance } from '../../domain/entities/goal-instance.entity';
import { GoalInstanceStatus } from '../../domain/enums/goal-instance-status.enum';
import { GoalInstanceOrmEntity } from './goal-instance.typeorm-entity';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';

export class GoalInstanceMapper {
  static toDomain(orm: GoalInstanceOrmEntity): GoalInstance {
    return GoalInstance.reconstitute({
      id: Uuid.from(orm.id),
      goalId: Uuid.from(orm.goalId),
      cycleStart: orm.cycleStart,
      cycleEnd: orm.cycleEnd,
      status: orm.status as GoalInstanceStatus,
      progress: Number(orm.progress),
      completedAt: orm.completedAt ?? undefined,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
      deletedAt: orm.deletedAt ?? undefined,
    });
  }

  static toPersistence(domain: GoalInstance): GoalInstanceOrmEntity {
    const orm = new GoalInstanceOrmEntity();
    orm.id = domain.id.value;
    orm.goalId = domain.goalId.value;
    orm.cycleStart = domain.cycleStart;
    orm.cycleEnd = domain.cycleEnd;
    orm.status = domain.status;
    orm.progress = domain.progress;
    orm.completedAt = domain.completedAt ?? null;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    orm.deletedAt = domain.deletedAt ?? null;
    return orm;
  }
}
