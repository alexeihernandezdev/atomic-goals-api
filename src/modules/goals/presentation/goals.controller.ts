import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Goal } from '../domain/entities/goal.entity';
import type { GoalInstance } from '../domain/entities/goal-instance.entity';
import {
  CurrentUser,
  type JwtPayload,
} from '../../auth/presentation/decorators/current-user.decorator';
import { CreateGoalUseCase } from '../application/use-cases/create-goal.use-case';
import { UpdateGoalUseCase } from '../application/use-cases/update-goal.use-case';
import { DeleteGoalUseCase } from '../application/use-cases/delete-goal.use-case';
import { RestoreGoalUseCase } from '../application/use-cases/restore-goal.use-case';
import { ListGoalsUseCase } from '../application/use-cases/list-goals.use-case';
import { GetGoalUseCase } from '../application/use-cases/get-goal.use-case';
import { ListGoalInstancesUseCase } from '../application/use-cases/list-goal-instances.use-case';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { ListGoalsQueryDto } from './dto/list-goals.query.dto';

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

function toGoalResponse(goal: Goal) {
  return {
    id: goal.id.value,
    userId: goal.userId.value,
    categoryId: goal.categoryId.value,
    name: goal.name,
    description: goal.description,
    type: goal.type,
    cyclePeriod: goal.cyclePeriod,
    customCycleDays: goal.customCycleDays,
    startDate: goal.startDate,
    endDate: goal.endDate,
    estimatedDurationMinutes: goal.estimatedDurationMinutes,
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt,
    deletedAt: goal.deletedAt,
  };
}

@ApiTags('goals')
@ApiBearerAuth()
@Controller('goals')
export class GoalsController {
  constructor(
    private readonly createGoalUseCase: CreateGoalUseCase,
    private readonly updateGoalUseCase: UpdateGoalUseCase,
    private readonly deleteGoalUseCase: DeleteGoalUseCase,
    private readonly restoreGoalUseCase: RestoreGoalUseCase,
    private readonly listGoalsUseCase: ListGoalsUseCase,
    private readonly getGoalUseCase: GetGoalUseCase,
    private readonly listGoalInstancesUseCase: ListGoalInstancesUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a goal with its first instance' })
  async create(@Body() dto: CreateGoalDto, @CurrentUser() user: JwtPayload) {
    const { goal, instance } = await this.createGoalUseCase.execute({
      userId: user.userId,
      categoryId: dto.categoryId,
      name: dto.name,
      description: dto.description,
      type: dto.type,
      cyclePeriod: dto.cyclePeriod,
      customCycleDays: dto.customCycleDays,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      estimatedDurationMinutes: dto.estimatedDurationMinutes,
    });
    return {
      ...toGoalResponse(goal),
      activeInstance: toInstanceResponse(instance),
    };
  }

  @Get()
  @ApiOperation({ summary: 'List goals for the authenticated user' })
  async list(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListGoalsQueryDto,
  ) {
    const results = await this.listGoalsUseCase.execute({
      userId: user.userId,
      categoryId: query.categoryId,
      type: query.type,
      page: query.page,
      limit: query.limit,
    });
    return results.map(({ goal, activeInstance }) => ({
      ...toGoalResponse(goal),
      activeInstance: activeInstance ? toInstanceResponse(activeInstance) : null,
    }));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a goal with its active instance' })
  async getOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const { goal, activeInstance } = await this.getGoalUseCase.execute({
      id,
      userId: user.userId,
    });
    return {
      ...toGoalResponse(goal),
      activeInstance: activeInstance
        ? toInstanceResponse(activeInstance)
        : null,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update goal metadata' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateGoalDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const goal = await this.updateGoalUseCase.execute({
      id,
      userId: user.userId,
      name: dto.name,
      description: dto.description,
      categoryId: dto.categoryId,
      cyclePeriod: dto.cyclePeriod,
      customCycleDays: dto.customCycleDays,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      estimatedDurationMinutes: dto.estimatedDurationMinutes,
    });
    return toGoalResponse(goal);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a goal' })
  async delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.deleteGoalUseCase.execute({ id, userId: user.userId });
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore a soft-deleted goal' })
  async restore(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const goal = await this.restoreGoalUseCase.execute({
      id,
      userId: user.userId,
    });
    return toGoalResponse(goal);
  }

  @Get(':id/instances')
  @ApiOperation({ summary: 'List all instances (cycle history) for a goal' })
  async listInstances(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const instances = await this.listGoalInstancesUseCase.execute({
      goalId: id,
      userId: user.userId,
    });
    return instances.map(toInstanceResponse);
  }
}
