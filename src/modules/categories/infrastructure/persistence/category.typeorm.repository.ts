import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../domain/entities/category.entity';
import type { ICategoryRepository } from '../../domain/ports/category.repository';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';
import { CategoryMapper } from './category.mapper';
import { CategoryOrmEntity } from './category.typeorm-entity';

@Injectable()
export class CategoryTypeOrmRepository implements ICategoryRepository {
  constructor(
    @InjectRepository(CategoryOrmEntity)
    private readonly repo: Repository<CategoryOrmEntity>,
  ) {}

  async findById(id: Uuid, userId: Uuid): Promise<Category | null> {
    const orm = await this.repo.findOne({
      where: { id: id.value, userId: userId.value },
    });
    return orm ? CategoryMapper.toDomain(orm) : null;
  }

  async findByIdWithDeleted(id: Uuid, userId: Uuid): Promise<Category | null> {
    const orm = await this.repo.findOne({
      where: { id: id.value, userId: userId.value },
      withDeleted: true,
    });
    return orm ? CategoryMapper.toDomain(orm) : null;
  }

  async findByName(name: string, userId: Uuid): Promise<Category | null> {
    const orm = await this.repo.findOne({
      where: { name, userId: userId.value },
    });
    return orm ? CategoryMapper.toDomain(orm) : null;
  }

  async findAllByUser(
    userId: Uuid,
    includeDeleted = false,
  ): Promise<Category[]> {
    const orms = await this.repo.find({
      where: { userId: userId.value },
      withDeleted: includeDeleted,
      order: { createdAt: 'ASC' },
    });
    return orms.map((orm) => CategoryMapper.toDomain(orm));
  }

  async save(category: Category): Promise<void> {
    await this.repo.save(CategoryMapper.toPersistence(category));
  }
}
