import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateStepUseCase } from './application/use-cases/create-step.use-case';
import { CreateStepsBatchUseCase } from './application/use-cases/create-steps-batch.use-case';
import { GetStepUseCase } from './application/use-cases/get-step.use-case';
import { ListStepsByGoalInstanceUseCase } from './application/use-cases/list-steps-by-goal-instance.use-case';
import { UpdateStepMetadataUseCase } from './application/use-cases/update-step-metadata.use-case';
import { UpdateStepProgressUseCase } from './application/use-cases/update-step-progress.use-case';
import { DeleteStepUseCase } from './application/use-cases/delete-step.use-case';
import { RestoreStepUseCase } from './application/use-cases/restore-step.use-case';
import { ReorderStepUseCase } from './application/use-cases/reorder-step.use-case';
import { STEP_TOKENS } from './infrastructure/step.tokens';
import { StepOrmEntity } from './infrastructure/persistence/step.typeorm-entity';
import { ProgressBarStepOrmEntity } from './infrastructure/persistence/progress-bar-step.typeorm-entity';
import { CheckStepOrmEntity } from './infrastructure/persistence/check-step.typeorm-entity';
import { StatusStepOrmEntity } from './infrastructure/persistence/status-step.typeorm-entity';
import { CounterStepOrmEntity } from './infrastructure/persistence/counter-step.typeorm-entity';
import { StepTypeOrmRepository } from './infrastructure/persistence/step.typeorm.repository';
import { GoalInstanceOrmEntity } from '../goals/infrastructure/persistence/goal-instance.typeorm-entity';
import { GoalOrmEntity } from '../goals/infrastructure/persistence/goal.typeorm-entity';
import { GoalInstanceTypeOrmRepository } from '../goals/infrastructure/persistence/goal-instance.typeorm.repository';
import { GoalTypeOrmRepository } from '../goals/infrastructure/persistence/goal.typeorm.repository';
import { GOAL_TOKENS } from '../goals/infrastructure/goal.tokens';
import { TypeOrmUnitOfWork } from '../goals/infrastructure/unit-of-work/typeorm-unit-of-work';
import { SyncConclusiveInstanceCycleService } from './application/services/sync-conclusive-instance-cycle.service';
import { StepsController } from './presentation/steps.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StepOrmEntity,
      ProgressBarStepOrmEntity,
      CheckStepOrmEntity,
      StatusStepOrmEntity,
      CounterStepOrmEntity,
      GoalInstanceOrmEntity,
      GoalOrmEntity,
    ]),
  ],
  controllers: [StepsController],
  providers: [
    SyncConclusiveInstanceCycleService,
    CreateStepUseCase,
    CreateStepsBatchUseCase,
    GetStepUseCase,
    ListStepsByGoalInstanceUseCase,
    UpdateStepMetadataUseCase,
    UpdateStepProgressUseCase,
    DeleteStepUseCase,
    RestoreStepUseCase,
    ReorderStepUseCase,
    { provide: STEP_TOKENS.STEP_REPOSITORY, useClass: StepTypeOrmRepository },
    {
      provide: STEP_TOKENS.GOAL_INSTANCE_REPOSITORY,
      useClass: GoalInstanceTypeOrmRepository,
    },
    { provide: GOAL_TOKENS.GOAL_REPOSITORY, useClass: GoalTypeOrmRepository },
    { provide: STEP_TOKENS.UNIT_OF_WORK, useClass: TypeOrmUnitOfWork },
  ],
  exports: [ListStepsByGoalInstanceUseCase, STEP_TOKENS.STEP_REPOSITORY],
})
export class StepsModule {}
