import { Goal } from '../../domain/entities/goal.entity';
import { GoalType } from '../../domain/enums/goal-type.enum';
import { CyclePeriod } from '../../domain/enums/cycle-period.enum';
import { GoalOrmEntity } from './goal.typeorm-entity';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';

export class GoalMapper {
  static toDomain(orm: GoalOrmEntity): Goal {
    return Goal.reconstitute({
      id: Uuid.from(orm.id),
      userId: Uuid.from(orm.userId),
      categoryId: Uuid.from(orm.categoryId),
      name: orm.name,
      description: orm.description ?? undefined,
      type: orm.type as GoalType,
      cyclePeriod: orm.cyclePeriod
        ? (orm.cyclePeriod as CyclePeriod)
        : undefined,
      customCycleDays: orm.customCycleDays ?? undefined,
      startDate: orm.startDate ?? undefined,
      endDate: orm.endDate ?? undefined,
      estimatedDurationMinutes: orm.estimatedDurationMinutes ?? undefined,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
      deletedAt: orm.deletedAt ?? undefined,
    });
  }

  static toPersistence(domain: Goal): GoalOrmEntity {
    const orm = new GoalOrmEntity();
    orm.id = domain.id.value;
    orm.userId = domain.userId.value;
    orm.categoryId = domain.categoryId.value;
    orm.name = domain.name;
    orm.description = domain.description ?? null;
    orm.type = domain.type;
    orm.cyclePeriod = domain.cyclePeriod ?? null;
    orm.customCycleDays = domain.customCycleDays ?? null;
    orm.startDate = domain.startDate ?? null;
    orm.endDate = domain.endDate ?? null;
    orm.estimatedDurationMinutes = domain.estimatedDurationMinutes ?? null;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    orm.deletedAt = domain.deletedAt ?? null;
    return orm;
  }
}
