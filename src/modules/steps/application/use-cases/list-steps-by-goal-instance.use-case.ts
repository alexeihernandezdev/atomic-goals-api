import { Inject, Injectable } from '@nestjs/common';
import type { Step } from '../../domain/entities/step.entity';
import type { IStepRepository } from '../../domain/ports/step.repository';
import { STEP_TOKENS } from '../../infrastructure/step.tokens';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';

@Injectable()
export class ListStepsByGoalInstanceUseCase {
  constructor(
    @Inject(STEP_TOKENS.STEP_REPOSITORY)
    private readonly stepRepo: IStepRepository,
  ) {}

  async execute(query: { goalInstanceId: string }): Promise<Step[]> {
    return this.stepRepo.findByGoalInstanceId(Uuid.from(query.goalInstanceId));
  }
}
