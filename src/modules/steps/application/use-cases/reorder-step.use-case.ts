import { Inject, Injectable } from '@nestjs/common';
import type { Step } from '../../domain/entities/step.entity';
import type { IStepRepository } from '../../domain/ports/step.repository';
import { StepNotFoundError } from '../../domain/errors/step-not-found.error';
import { STEP_TOKENS } from '../../infrastructure/step.tokens';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';

interface ReorderStepCommand {
  id: string;
  newOrder: number;
}

@Injectable()
export class ReorderStepUseCase {
  constructor(
    @Inject(STEP_TOKENS.STEP_REPOSITORY)
    private readonly stepRepo: IStepRepository,
  ) {}

  async execute(command: ReorderStepCommand): Promise<Step> {
    const step = await this.stepRepo.findById(Uuid.from(command.id));
    if (!step) throw new StepNotFoundError(command.id);

    step.updateMetadata({ order: command.newOrder });
    await this.stepRepo.save(step);
    return step;
  }
}
