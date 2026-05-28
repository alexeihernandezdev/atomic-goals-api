import { Inject, Injectable } from '@nestjs/common';
import type { Step } from '../../domain/entities/step.entity';
import type { IStepRepository } from '../../domain/ports/step.repository';
import { StepNotFoundError } from '../../domain/errors/step-not-found.error';
import { STEP_TOKENS } from '../../infrastructure/step.tokens';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';

@Injectable()
export class GetStepUseCase {
  constructor(
    @Inject(STEP_TOKENS.STEP_REPOSITORY)
    private readonly stepRepo: IStepRepository,
  ) {}

  async execute(query: { id: string }): Promise<Step> {
    const step = await this.stepRepo.findById(Uuid.from(query.id));
    if (!step) throw new StepNotFoundError(query.id);
    return step;
  }
}
