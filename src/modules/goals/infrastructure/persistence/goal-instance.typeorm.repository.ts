import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import type { GoalInstance } from '../../domain/entities/goal-instance.entity';
import type { IGoalInstanceRepository } from '../../domain/ports/goal-instance.repository';
import type { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';
import { GoalInstanceStatus } from '../../domain/enums/goal-instance-status.enum';
import { GoalInstanceOrmEntity } from './goal-instance.typeorm-entity';
import { GoalInstanceMapper } from './goal-instance.mapper';
import { transactionContext } from '../../../../database/transaction-context';

@Injectable()
export class GoalInstanceTypeOrmRepository implements IGoalInstanceRepository {
  constructor(
    @InjectRepository(GoalInstanceOrmEntity)
    private readonly repo: Repository<GoalInstanceOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  private get manager() {
    return transactionContext.getStore() ?? this.dataSource.manager;
  }

  async findById(id: Uuid): Promise<GoalInstance | null> {
    const orm = await this.repo.findOne({ where: { id: id.value } });
    return orm ? GoalInstanceMapper.toDomain(orm) : null;
  }

  async findByGoalId(goalId: Uuid): Promise<GoalInstance[]> {
    const orms = await this.repo.find({
      where: { goalId: goalId.value },
      order: { cycleStart: 'DESC' },
    });
    return orms.map((orm) => GoalInstanceMapper.toDomain(orm));
  }

  async findActiveByGoalId(goalId: Uuid): Promise<GoalInstance | null> {
    const orm = await this.repo.findOne({
      where: { goalId: goalId.value, status: GoalInstanceStatus.IN_PROGRESS },
    });
    return orm ? GoalInstanceMapper.toDomain(orm) : null;
  }

  async findActiveManyByGoalIds(goalIds: Uuid[]): Promise<GoalInstance[]> {
    if (goalIds.length === 0) return [];
    const orms = await this.repo.find({
      where: {
        goalId: In(goalIds.map((id) => id.value)),
        status: GoalInstanceStatus.IN_PROGRESS,
      },
    });
    return orms.map((orm) => GoalInstanceMapper.toDomain(orm));
  }

  async save(instance: GoalInstance): Promise<void> {
    await this.manager.save(
      GoalInstanceOrmEntity,
      GoalInstanceMapper.toPersistence(instance),
    );
  }
}
