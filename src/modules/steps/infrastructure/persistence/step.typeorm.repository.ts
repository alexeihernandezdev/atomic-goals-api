import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import type { Step } from '../../domain/entities/step.entity';
import type { IStepRepository } from '../../domain/ports/step.repository';
import type { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';
import { StepOrmEntity } from './step.typeorm-entity';
import { StepMapper } from './step.mapper';
import { transactionContext } from '../../../../database/transaction-context';

@Injectable()
export class StepTypeOrmRepository implements IStepRepository {
  constructor(
    @InjectRepository(StepOrmEntity)
    private readonly repo: Repository<StepOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  private get manager() {
    return transactionContext.getStore() ?? this.dataSource.manager;
  }

  async findById(id: Uuid): Promise<Step | null> {
    const orm = await this.repo.findOne({
      where: { id: id.value },
      withDeleted: true,
    });
    return orm ? StepMapper.toDomain(orm) : null;
  }

  async findByGoalInstanceId(goalInstanceId: Uuid): Promise<Step[]> {
    const orms = await this.repo.find({
      where: { goalInstanceId: goalInstanceId.value },
      withDeleted: true,
      order: { order: 'ASC' },
    });
    return orms.map((orm) => StepMapper.toDomain(orm));
  }

  async findActiveByGoalInstanceId(goalInstanceId: Uuid): Promise<Step[]> {
    const orms = await this.repo.find({
      where: { goalInstanceId: goalInstanceId.value, deletedAt: IsNull() },
      order: { order: 'ASC' },
    });
    return orms.map((orm) => StepMapper.toDomain(orm));
  }

  async save(step: Step): Promise<void> {
    await this.manager.save(StepOrmEntity, StepMapper.toPersistence(step));
  }
}
