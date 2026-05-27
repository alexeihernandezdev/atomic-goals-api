import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';
import { Category } from '../entities/category.entity';

export interface ICategoryRepository {
  findById(id: Uuid, userId: Uuid): Promise<Category | null>;
  findByIdWithDeleted(id: Uuid, userId: Uuid): Promise<Category | null>;
  findByName(name: string, userId: Uuid): Promise<Category | null>;
  findAllByUser(userId: Uuid, includeDeleted?: boolean): Promise<Category[]>;
  save(category: Category): Promise<void>;
}
