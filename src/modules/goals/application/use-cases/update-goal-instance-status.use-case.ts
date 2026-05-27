import { Inject, Injectable } from '@nestjs/common';
import type { GoalInstance } from '../../domain/entities/goal-instance.entity';
import type { IGoalInstanceRepository } from '../../domain/ports/goal-instance.repository';
import { GoalInstanceStatus } from '../../domain/enums/goal-instance-status.enum';
import { GoalInstanceNotFoundError } from '../../domain/errors/goal-instance-not-found.error';
import { GOAL_TOKENS } from '../../infrastructure/goal.tokens';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';

interface UpdateGoalInstanceStatusCommand {
  id: string;
  status: GoalInstanceStatus;
}

@Injectable()
export class UpdateGoalInstanceStatusUseCase {
  constructor(
    @Inject(GOAL_TOKENS.GOAL_INSTANCE_REPOSITORY)
    private readonly instanceRepo: IGoalInstanceRepository,
  ) {}

  async execute(
    command: UpdateGoalInstanceStatusCommand,
  ): Promise<GoalInstance> {
    const id = Uuid.from(command.id);
    const instance = await this.instanceRepo.findById(id);
    if (!instance) throw new GoalInstanceNotFoundError(command.id);

    instance.updateStatus(command.status);
    await this.instanceRepo.save(instance);
    return instance;
  }
}
