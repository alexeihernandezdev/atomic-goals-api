import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateGoalUseCase } from './application/use-cases/create-goal.use-case';
import { UpdateGoalUseCase } from './application/use-cases/update-goal.use-case';
import { DeleteGoalUseCase } from './application/use-cases/delete-goal.use-case';
import { RestoreGoalUseCase } from './application/use-cases/restore-goal.use-case';
import { ListGoalsUseCase } from './application/use-cases/list-goals.use-case';
import { GetGoalUseCase } from './application/use-cases/get-goal.use-case';
import { ListGoalInstancesUseCase } from './application/use-cases/list-goal-instances.use-case';
import { GetGoalInstanceUseCase } from './application/use-cases/get-goal-instance.use-case';
import { UpdateGoalInstanceStatusUseCase } from './application/use-cases/update-goal-instance-status.use-case';
import { CompleteGoalInstanceUseCase } from './application/use-cases/complete-goal-instance.use-case';
import { CloseAndCreateNextCycleUseCase } from './application/use-cases/close-and-create-next-cycle.use-case';
import { GOAL_TOKENS } from './infrastructure/goal.tokens';
import { GoalOrmEntity } from './infrastructure/persistence/goal.typeorm-entity';
import { GoalInstanceOrmEntity } from './infrastructure/persistence/goal-instance.typeorm-entity';
import { GoalTypeOrmRepository } from './infrastructure/persistence/goal.typeorm.repository';
import { GoalInstanceTypeOrmRepository } from './infrastructure/persistence/goal-instance.typeorm.repository';
import { SystemClock } from './infrastructure/clock/system-clock';
import { TypeOrmUnitOfWork } from './infrastructure/unit-of-work/typeorm-unit-of-work';
import { GoalsController } from './presentation/goals.controller';
import { GoalInstancesController } from './presentation/goal-instances.controller';
import { StepsModule } from '../steps/steps.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GoalOrmEntity, GoalInstanceOrmEntity]),
    StepsModule,
  ],
  controllers: [GoalsController, GoalInstancesController],
  providers: [
    CreateGoalUseCase,
    UpdateGoalUseCase,
    DeleteGoalUseCase,
    RestoreGoalUseCase,
    ListGoalsUseCase,
    GetGoalUseCase,
    ListGoalInstancesUseCase,
    GetGoalInstanceUseCase,
    UpdateGoalInstanceStatusUseCase,
    CompleteGoalInstanceUseCase,
    CloseAndCreateNextCycleUseCase,
    { provide: GOAL_TOKENS.GOAL_REPOSITORY, useClass: GoalTypeOrmRepository },
    {
      provide: GOAL_TOKENS.GOAL_INSTANCE_REPOSITORY,
      useClass: GoalInstanceTypeOrmRepository,
    },
    { provide: GOAL_TOKENS.CLOCK, useClass: SystemClock },
    { provide: GOAL_TOKENS.UNIT_OF_WORK, useClass: TypeOrmUnitOfWork },
  ],
})
export class GoalsModule {}
