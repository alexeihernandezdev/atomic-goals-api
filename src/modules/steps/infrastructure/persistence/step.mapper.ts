import { Step } from '../../domain/entities/step.entity';
import { ProgressBarStep } from '../../domain/entities/progress-bar-step.entity';
import { CheckStep } from '../../domain/entities/check-step.entity';
import { StatusStep } from '../../domain/entities/status-step.entity';
import { CounterStep } from '../../domain/entities/counter-step.entity';
import { StepType } from '../../domain/enums/step-type.enum';
import { StepOrmEntity } from './step.typeorm-entity';
import { ProgressBarStepOrmEntity } from './progress-bar-step.typeorm-entity';
import { CheckStepOrmEntity } from './check-step.typeorm-entity';
import { StatusStepOrmEntity } from './status-step.typeorm-entity';
import { CounterStepOrmEntity } from './counter-step.typeorm-entity';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';

const baseProps = (orm: StepOrmEntity) => ({
  id: Uuid.from(orm.id),
  goalInstanceId: Uuid.from(orm.goalInstanceId),
  title: orm.title,
  description: orm.description ?? undefined,
  weight: Number(orm.weight),
  order: orm.order,
  unit: orm.unit ?? undefined,
  startDate: orm.startDate ?? undefined,
  endDate: orm.endDate ?? undefined,
  cycleDay: orm.cycleDay ?? undefined,
  estimatedDurationMinutes: orm.estimatedDurationMinutes ?? undefined,
  createdAt: orm.createdAt,
  updatedAt: orm.updatedAt,
  deletedAt: orm.deletedAt ?? undefined,
});

export class StepMapper {
  static toDomain(orm: StepOrmEntity): Step {
    switch (orm.type as StepType) {
      case StepType.PROGRESS_BAR: {
        const pb = orm as ProgressBarStepOrmEntity;
        return ProgressBarStep.reconstitute({
          ...baseProps(orm),
          target: Number(pb.target),
          current: Number(pb.current),
        });
      }
      case StepType.CHECK: {
        const ch = orm as CheckStepOrmEntity;
        return CheckStep.reconstitute({ ...baseProps(orm), done: ch.done });
      }
      case StepType.STATUS: {
        const st = orm as StatusStepOrmEntity;
        return StatusStep.reconstitute({
          ...baseProps(orm),
          statuses: st.statuses,
          currentStatusId: st.currentStatusId,
        });
      }
      case StepType.COUNTER: {
        const co = orm as CounterStepOrmEntity;
        return CounterStep.reconstitute({
          ...baseProps(orm),
          max: Number(co.max),
          min: Number(co.min),
          current: Number(co.current),
        });
      }
    }
  }

  static toPersistence(domain: Step): StepOrmEntity {
    if (domain instanceof ProgressBarStep) {
      const orm = new ProgressBarStepOrmEntity();
      StepMapper.fillBase(orm, domain);
      orm.current = domain.current;
      orm.target = domain.target;
      return orm;
    }
    if (domain instanceof CheckStep) {
      const orm = new CheckStepOrmEntity();
      StepMapper.fillBase(orm, domain);
      orm.done = domain.done;
      return orm;
    }
    if (domain instanceof StatusStep) {
      const orm = new StatusStepOrmEntity();
      StepMapper.fillBase(orm, domain);
      orm.statuses = domain.statuses;
      orm.currentStatusId = domain.currentStatusId;
      return orm;
    }
    if (domain instanceof CounterStep) {
      const orm = new CounterStepOrmEntity();
      StepMapper.fillBase(orm, domain);
      orm.current = domain.current;
      orm.max = domain.max;
      orm.min = domain.min;
      return orm;
    }
    throw new Error(`Unknown step type: ${domain.type}`);
  }

  private static fillBase(orm: StepOrmEntity, domain: Step): void {
    orm.id = domain.id.value;
    orm.goalInstanceId = domain.goalInstanceId.value;
    orm.type = domain.type;
    orm.title = domain.title;
    orm.description = domain.description ?? null;
    orm.weight = domain.weight;
    orm.order = domain.order;
    orm.unit = (domain as ProgressBarStep | CounterStep).unit ?? null;
    orm.startDate = domain.startDate ?? null;
    orm.endDate = domain.endDate ?? null;
    orm.cycleDay = domain.cycleDay ?? null;
    orm.estimatedDurationMinutes = domain.estimatedDurationMinutes ?? null;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    orm.deletedAt = domain.deletedAt ?? null;
  }
}
