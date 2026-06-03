import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import type { GoalDerivedMetrics } from '../../../goals/domain/services/goal-derived-metrics';
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

  async findDerivedMetricsByGoalInstanceIds(
    goalInstanceIds: Uuid[],
  ): Promise<Map<string, GoalDerivedMetrics>> {
    const result = new Map<string, GoalDerivedMetrics>();
    if (goalInstanceIds.length === 0) return result;

    const ids = goalInstanceIds.map((id) => id.value);
    const rows = await this.dataSource.query<
      {
        goalInstanceId: string;
        startDate: Date | null;
        endDate: Date | null;
        estimatedDurationMinutes: string | null;
      }[]
    >(
      `SELECT s."goalInstanceId",
              MIN(s."startDate") AS "startDate",
              MAX(s."endDate") AS "endDate",
              SUM(s."estimatedDurationMinutes") AS "estimatedDurationMinutes"
       FROM steps s
       WHERE s."goalInstanceId" = ANY($1::uuid[])
         AND s."deletedAt" IS NULL
       GROUP BY s."goalInstanceId"`,
      [ids],
    );

    for (const row of rows) {
      const minutes =
        row.estimatedDurationMinutes != null
          ? parseInt(row.estimatedDurationMinutes, 10)
          : undefined;
      result.set(row.goalInstanceId, {
        startDate: row.startDate ?? undefined,
        endDate: row.endDate ?? undefined,
        estimatedDurationMinutes:
          minutes != null && !Number.isNaN(minutes) ? minutes : undefined,
      });
    }

    return result;
  }

  async save(step: Step): Promise<void> {
    await this.manager.save(StepOrmEntity, StepMapper.toPersistence(step));
  }
}
