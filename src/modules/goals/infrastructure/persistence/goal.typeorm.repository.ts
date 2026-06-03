import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import type { Goal } from '../../domain/entities/goal.entity';
import type {
  IGoalRepository,
  GoalFilters,
} from '../../domain/ports/goal.repository';
import type { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';
import { GoalOrmEntity } from './goal.typeorm-entity';
import { GoalMapper } from './goal.mapper';
import { transactionContext } from '../../../../database/transaction-context';

@Injectable()
export class GoalTypeOrmRepository implements IGoalRepository {
  constructor(
    @InjectRepository(GoalOrmEntity)
    private readonly repo: Repository<GoalOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  private get manager() {
    return transactionContext.getStore() ?? this.dataSource.manager;
  }

  async findById(id: Uuid, userId: Uuid): Promise<Goal | null> {
    const orm = await this.repo.findOne({
      where: { id: id.value, userId: userId.value },
    });
    return orm ? GoalMapper.toDomain(orm) : null;
  }

  async findByIdInternal(id: Uuid): Promise<Goal | null> {
    const orm = await this.repo.findOne({ where: { id: id.value } });
    return orm ? GoalMapper.toDomain(orm) : null;
  }

  async findByIdWithDeleted(id: Uuid, userId: Uuid): Promise<Goal | null> {
    const orm = await this.repo.findOne({
      where: { id: id.value, userId: userId.value },
      withDeleted: true,
    });
    return orm ? GoalMapper.toDomain(orm) : null;
  }

  async findAllByUser(userId: Uuid, filters?: GoalFilters): Promise<Goal[]> {
    const qb = this.repo
      .createQueryBuilder('goal')
      .where('goal.userId = :userId', { userId: userId.value });

    if (filters?.categoryId) {
      qb.andWhere('goal.categoryId = :categoryId', {
        categoryId: filters.categoryId.value,
      });
    }
    if (filters?.type) {
      qb.andWhere('goal.type = :type', { type: filters.type });
    }
    if (filters?.includeDeleted) {
      qb.withDeleted();
    }

    qb.orderBy('goal.createdAt', 'ASC');

    if (filters?.limit) {
      qb.take(filters.limit);
    }
    if (filters?.page && filters.limit) {
      qb.skip((filters.page - 1) * filters.limit);
    }

    const orms = await qb.getMany();
    return orms.map((orm) => GoalMapper.toDomain(orm));
  }

  async save(goal: Goal): Promise<void> {
    await this.manager.save(GoalOrmEntity, GoalMapper.toPersistence(goal));
  }
}
