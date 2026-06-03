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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProgressBarStep } from '../domain/entities/progress-bar-step.entity';
import { CheckStep } from '../domain/entities/check-step.entity';
import { StatusStep } from '../domain/entities/status-step.entity';
import { CounterStep } from '../domain/entities/counter-step.entity';
import type { Step } from '../domain/entities/step.entity';
import { CreateStepUseCase } from '../application/use-cases/create-step.use-case';
import { CreateStepsBatchUseCase } from '../application/use-cases/create-steps-batch.use-case';
import { GetStepUseCase } from '../application/use-cases/get-step.use-case';
import { UpdateStepMetadataUseCase } from '../application/use-cases/update-step-metadata.use-case';
import { UpdateStepProgressUseCase } from '../application/use-cases/update-step-progress.use-case';
import { DeleteStepUseCase } from '../application/use-cases/delete-step.use-case';
import { RestoreStepUseCase } from '../application/use-cases/restore-step.use-case';
import { ReorderStepUseCase } from '../application/use-cases/reorder-step.use-case';
import { CreateStepDto } from './dto/create-step.dto';
import { CreateStepsBatchDto } from './dto/create-steps-batch.dto';
import { UpdateStepMetadataDto } from './dto/update-step-metadata.dto';
import { UpdateStepProgressDto } from './dto/update-step-progress.dto';
import { ReorderStepDto } from './dto/reorder-step.dto';

function toStepResponse(step: Step) {
  const base = {
    id: step.id.value,
    goalInstanceId: step.goalInstanceId.value,
    type: step.type,
    title: step.title,
    description: step.description,
    weight: step.weight,
    order: step.order,
    progress: step.progress(),
    startDate: step.startDate,
    endDate: step.endDate,
    cycleDay: step.cycleDay,
    cycleGroupId: step.cycleGroupId,
    estimatedDurationMinutes: step.estimatedDurationMinutes,
    createdAt: step.createdAt,
    updatedAt: step.updatedAt,
    deletedAt: step.deletedAt,
  };

  if (step instanceof ProgressBarStep) {
    return {
      ...base,
      current: step.current,
      target: step.target,
      unit: step.unit,
    };
  }
  if (step instanceof CheckStep) {
    return { ...base, done: step.done };
  }
  if (step instanceof StatusStep) {
    return {
      ...base,
      statuses: step.statuses,
      currentStatusId: step.currentStatusId,
    };
  }
  if (step instanceof CounterStep) {
    return {
      ...base,
      current: step.current,
      max: step.max,
      min: step.min,
      unit: step.unit,
    };
  }
  return base;
}

@ApiTags('steps')
@ApiBearerAuth()
@Controller('steps')
export class StepsController {
  constructor(
    private readonly createStepUseCase: CreateStepUseCase,
    private readonly createStepsBatchUseCase: CreateStepsBatchUseCase,
    private readonly getStepUseCase: GetStepUseCase,
    private readonly updateStepMetadataUseCase: UpdateStepMetadataUseCase,
    private readonly updateStepProgressUseCase: UpdateStepProgressUseCase,
    private readonly deleteStepUseCase: DeleteStepUseCase,
    private readonly restoreStepUseCase: RestoreStepUseCase,
    private readonly reorderStepUseCase: ReorderStepUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a step for a goal instance' })
  async create(@Body() dto: CreateStepDto) {
    const step = await this.createStepUseCase.execute({
      goalInstanceId: dto.goalInstanceId,
      type: dto.type,
      title: dto.title,
      description: dto.description,
      weight: dto.weight,
      order: dto.order,
      unit: dto.unit,
      current: dto.current,
      target: dto.target,
      max: dto.max,
      min: dto.min,
      done: dto.done,
      statuses: dto.statuses,
      currentStatusId: dto.currentStatusId,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      cycleDay: dto.cycleDay,
      estimatedDurationMinutes: dto.estimatedDurationMinutes,
    });
    return toStepResponse(step);
  }

  @Post('batch')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create several steps at once as a linked recurring group',
  })
  async createBatch(@Body() dto: CreateStepsBatchDto) {
    const steps = await this.createStepsBatchUseCase.execute({
      goalInstanceId: dto.goalInstanceId,
      baseOrder: dto.baseOrder,
      steps: dto.steps.map((s) => ({
        type: s.type,
        title: s.title,
        description: s.description,
        weight: s.weight,
        unit: s.unit,
        current: s.current,
        target: s.target,
        max: s.max,
        min: s.min,
        done: s.done,
        statuses: s.statuses,
        currentStatusId: s.currentStatusId,
        startDate: s.startDate ? new Date(s.startDate) : undefined,
        endDate: s.endDate ? new Date(s.endDate) : undefined,
        cycleDay: s.cycleDay,
        estimatedDurationMinutes: s.estimatedDurationMinutes,
      })),
    });
    return steps.map(toStepResponse);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a step by id' })
  async getOne(@Param('id') id: string) {
    const step = await this.getStepUseCase.execute({ id });
    return toStepResponse(step);
  }

  @Patch(':id/metadata')
  @ApiOperation({
    summary: 'Update step metadata (title, description, weight, order, dates)',
  })
  async updateMetadata(
    @Param('id') id: string,
    @Body() dto: UpdateStepMetadataDto,
  ) {
    const step = await this.updateStepMetadataUseCase.execute({
      id,
      title: dto.title,
      description: dto.description,
      weight: dto.weight,
      order: dto.order,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      cycleDay: dto.cycleDay,
      estimatedDurationMinutes: dto.estimatedDurationMinutes,
    });
    return toStepResponse(step);
  }

  @Patch(':id')
  @ApiOperation({
    summary:
      'Update step progress (current, done, currentStatusId); recalculates GoalInstance.progress',
  })
  async updateProgress(
    @Param('id') id: string,
    @Body() dto: UpdateStepProgressDto,
  ) {
    const step = await this.updateStepProgressUseCase.execute({
      id,
      current: dto.current,
      done: dto.done,
      currentStatusId: dto.currentStatusId,
    });
    return toStepResponse(step);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a step' })
  async delete(@Param('id') id: string) {
    await this.deleteStepUseCase.execute({ id });
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore a soft-deleted step' })
  async restore(@Param('id') id: string) {
    const step = await this.restoreStepUseCase.execute({ id });
    return toStepResponse(step);
  }

  @Post(':id/reorder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change step order within its goal instance' })
  async reorder(@Param('id') id: string, @Body() dto: ReorderStepDto) {
    const step = await this.reorderStepUseCase.execute({
      id,
      newOrder: dto.newOrder,
    });
    return toStepResponse(step);
  }
}
