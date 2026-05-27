import { Category } from '../../domain/entities/category.entity';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';
import { CategoryOrmEntity } from './category.typeorm-entity';

export class CategoryMapper {
  static toDomain(orm: CategoryOrmEntity): Category {
    return Category.reconstitute({
      id: Uuid.from(orm.id),
      userId: Uuid.from(orm.userId),
      name: orm.name,
      description: orm.description,
      color: orm.color,
      icon: orm.icon,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
      deletedAt: orm.deletedAt,
    });
  }

  static toPersistence(category: Category): Partial<CategoryOrmEntity> {
    return {
      id: category.id.value,
      userId: category.userId.value,
      name: category.name,
      description: category.description,
      color: category.color,
      icon: category.icon,
      deletedAt: category.deletedAt,
    };
  }
}
