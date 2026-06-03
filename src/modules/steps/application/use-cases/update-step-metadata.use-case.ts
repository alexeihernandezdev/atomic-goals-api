import { Inject, Injectable } from '@nestjs/common';
import type { Step } from '../../domain/entities/step.entity';
import type { IStepRepository } from '../../domain/ports/step.repository';
import type { IGoalInstanceRepository } from '../../../goals/domain/ports/goal-instance.repository';
import { GoalInstanceNotFoundError } from '../../../goals/domain/errors/goal-instance-not-found.error';
import { StepNotFoundError } from '../../domain/errors/step-not-found.error';
import { SyncConclusiveInstanceCycleService } from '../services/sync-conclusive-instance-cycle.service';
import { STEP_TOKENS } from '../../infrastructure/step.tokens';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';

interface UpdateStepMetadataCommand {
  id: string;
  title?: string;
  description?: string;
  weight?: number;
  order?: number;
  startDate?: Date;
  endDate?: Date;
  cycleDay?: string;
  estimatedDurationMinutes?: number;
}

@Injectable()
export class UpdateStepMetadataUseCase {
  constructor(
    @Inject(STEP_TOKENS.STEP_REPOSITORY)
    private readonly stepRepo: IStepRepository,
    @Inject(STEP_TOKENS.GOAL_INSTANCE_REPOSITORY)
    private readonly instanceRepo: IGoalInstanceRepository,
    private readonly syncConclusiveCycle: SyncConclusiveInstanceCycleService,
  ) {}

  async execute(command: UpdateStepMetadataCommand): Promise<Step> {
    const step = await this.stepRepo.findById(Uuid.from(command.id));
    if (!step) throw new StepNotFoundError(command.id);

    step.updateMetadata({
      title: command.title,
      description: command.description,
      weight: command.weight,
      order: command.order,
      startDate: command.startDate,
      endDate: command.endDate,
      cycleDay: command.cycleDay,
      estimatedDurationMinutes: command.estimatedDurationMinutes,
    });

    await this.stepRepo.save(step);

    const instance = await this.instanceRepo.findById(step.goalInstanceId);
    if (!instance)
      throw new GoalInstanceNotFoundError(step.goalInstanceId.value);
    await this.syncConclusiveCycle.syncForInstance(instance);

    return step;
  }
}
