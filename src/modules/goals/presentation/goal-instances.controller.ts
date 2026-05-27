import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { GoalInstance } from '../domain/entities/goal-instance.entity';
import {
  CurrentUser,
  type JwtPayload,
} from '../../auth/presentation/decorators/current-user.decorator';
import { GetGoalInstanceUseCase } from '../application/use-cases/get-goal-instance.use-case';
import { UpdateGoalInstanceStatusUseCase } from '../application/use-cases/update-goal-instance-status.use-case';
import { CompleteGoalInstanceUseCase } from '../application/use-cases/complete-goal-instance.use-case';
import { ListStepsByGoalInstanceUseCase } from '../../steps/application/use-cases/list-steps-by-goal-instance.use-case';
import { UpdateGoalInstanceStatusDto } from './dto/update-goal-instance-status.dto';
import { ProgressBarStep } from '../../steps/domain/entities/progress-bar-step.entity';
import { CheckStep } from '../../steps/domain/entities/check-step.entity';
import { StatusStep } from '../../steps/domain/entities/status-step.entity';
import { CounterStep } from '../../steps/domain/entities/counter-step.entity';
import type { Step } from '../../steps/domain/entities/step.entity';

function toStepResponse(step: Step) {
  const base = {
    id: step.id.value,
    type: step.type,
    title: step.title,
    description: step.description,
    weight: step.weight,
    order: step.order,
    progress: step.progress(),
    deletedAt: step.deletedAt,
  };
  if (step instanceof ProgressBarStep)
    return {
      ...base,
      current: step.current,
      target: step.target,
      unit: step.unit,
    };
  if (step instanceof CheckStep) return { ...base, done: step.done };
  if (step instanceof StatusStep)
    return {
      ...base,
      statuses: step.statuses,
      currentStatusId: step.currentStatusId,
    };
  if (step instanceof CounterStep)
    return {
      ...base,
      current: step.current,
      max: step.max,
      min: step.min,
      unit: step.unit,
    };
  return base;
}

function toInstanceResponse(instance: GoalInstance) {
  return {
    id: instance.id.value,
    goalId: instance.goalId.value,
    cycleStart: instance.cycleStart,
    cycleEnd: instance.cycleEnd,
    status: instance.status,
    progress: instance.progress,
    completedAt: instance.completedAt,
    createdAt: instance.createdAt,
    updatedAt: instance.updatedAt,
  };
}

@ApiTags('goal-instances')
@ApiBearerAuth()
@Controller('goal-instances')
export class GoalInstancesController {
  constructor(
    private readonly getGoalInstanceUseCase: GetGoalInstanceUseCase,
    private readonly updateGoalInstanceStatusUseCase: UpdateGoalInstanceStatusUseCase,
    private readonly completeGoalInstanceUseCase: CompleteGoalInstanceUseCase,
    private readonly listStepsByGoalInstanceUseCase: ListStepsByGoalInstanceUseCase,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get a goal instance with its steps' })
  async getOne(@Param('id') id: string) {
    const [instance, steps] = await Promise.all([
      this.getGoalInstanceUseCase.execute({ id }),
      this.listStepsByGoalInstanceUseCase.execute({ goalInstanceId: id }),
    ]);
    return {
      ...toInstanceResponse(instance),
      steps: steps.map(toStepResponse),
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update goal instance status manually' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateGoalInstanceStatusDto,
  ) {
    const instance = await this.updateGoalInstanceStatusUseCase.execute({
      id,
      status: dto.status,
    });
    return toInstanceResponse(instance);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Force-complete a goal instance; creates next cycle if CYCLIC',
  })
  async complete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const instance = await this.completeGoalInstanceUseCase.execute({
      id,
      userId: user.userId,
    });
    return toInstanceResponse(instance);
  }
}
