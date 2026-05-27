import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import type { ActivityLog } from '../../domain/entities/activity-log.entity';
import type {
  IActivityLogRepository,
  FindActivityOptions,
} from '../../domain/ports/activity-log.repository';
import type { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';
import { ActivityLogOrmEntity } from './activity-log.typeorm-entity';
import { ActivityLogMapper } from './activity-log.mapper';

@Injectable()
export class ActivityLogTypeOrmRepository implements IActivityLogRepository {
  constructor(
    @InjectRepository(ActivityLogOrmEntity)
    private readonly repo: Repository<ActivityLogOrmEntity>,
  ) {}

  async findByUserId(
    userId: Uuid,
    options?: FindActivityOptions,
  ): Promise<ActivityLog[]> {
    const limit = options?.limit ?? 21;
    const orms = await this.repo.find({
      where: {
        userId: userId.value,
        ...(options?.before ? { createdAt: LessThan(options.before) } : {}),
      },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return orms.map((orm) => ActivityLogMapper.toDomain(orm));
  }

  async save(log: ActivityLog): Promise<void> {
    await this.repo.save(ActivityLogMapper.toPersistence(log));
  }
}
