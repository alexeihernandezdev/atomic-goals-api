import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StepType } from '../../domain/enums/step-type.enum';
import { StatusOptionDto } from './status-option.dto';

export class CreateStepDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @IsUUID()
  goalInstanceId: string;

  @ApiProperty({ enum: StepType, example: StepType.PROGRESS_BAR })
  @IsEnum(StepType)
  type: StepType;

  @ApiProperty({ example: 'Complete chapter 1' })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiPropertyOptional({ example: 'Read pages 1–30' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 1.5,
    description: 'Weight for weighted-average progress (default 1)',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  weight?: number;

  @ApiProperty({
    example: 0,
    minimum: 0,
    description: 'Display order within the goal instance',
  })
  @IsInt()
  @Min(0)
  order: number;

  @ApiPropertyOptional({
    example: 'pages',
    description: 'Unit label (PROGRESS_BAR and COUNTER)',
  })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({
    example: 0,
    description: 'Initial current value (PROGRESS_BAR, COUNTER)',
  })
  @ValidateIf(
    (o: CreateStepDto) =>
      o.type === StepType.PROGRESS_BAR || o.type === StepType.COUNTER,
  )
  @IsNumber()
  @Min(0)
  current?: number;

  @ApiPropertyOptional({
    example: 100,
    description: 'Target value — required for PROGRESS_BAR',
  })
  @ValidateIf((o: CreateStepDto) => o.type === StepType.PROGRESS_BAR)
  @IsNumber()
  @IsPositive()
  target?: number;

  @ApiPropertyOptional({
    example: 50,
    description: 'Max value — required for COUNTER',
  })
  @ValidateIf((o: CreateStepDto) => o.type === StepType.COUNTER)
  @IsNumber()
  max?: number;

  @ApiPropertyOptional({
    example: 0,
    description: 'Min value for COUNTER (default 0)',
  })
  @IsOptional()
  @IsNumber()
  min?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Initial done state for CHECK',
  })
  @IsOptional()
  @IsBoolean()
  done?: boolean;

  @ApiPropertyOptional({
    type: [StatusOptionDto],
    description: 'Status options — required for STATUS',
  })
  @ValidateIf((o: CreateStepDto) => o.type === StepType.STATUS)
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StatusOptionDto)
  statuses?: StatusOptionDto[];

  @ApiPropertyOptional({
    example: 'not-started',
    description: 'Active status id — required for STATUS',
  })
  @ValidateIf((o: CreateStepDto) => o.type === StepType.STATUS)
  @IsString()
  currentStatusId?: string;

  @ApiPropertyOptional({ example: '2025-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-03-31T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  estimatedDurationMinutes?: number;
}
