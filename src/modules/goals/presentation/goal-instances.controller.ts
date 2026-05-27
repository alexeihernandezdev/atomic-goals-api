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
import { UpdateGoalInstanceStatusDto } from './dto/update-goal-instance-status.dto';

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
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get a goal instance by id' })
  async getOne(@Param('id') id: string) {
    const instance = await this.getGoalInstanceUseCase.execute({ id });
    return toInstanceResponse(instance);
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
