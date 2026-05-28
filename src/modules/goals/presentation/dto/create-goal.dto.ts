import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { GoalType } from '../../domain/enums/goal-type.enum';
import { CyclePeriod } from '../../domain/enums/cycle-period.enum';

export class CreateGoalDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: 'Run 5k every day' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({ example: 'Build a daily running habit' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: GoalType, example: GoalType.CYCLIC })
  @IsEnum(GoalType)
  type: GoalType;

  @ApiPropertyOptional({
    enum: CyclePeriod,
    example: CyclePeriod.DAILY,
    description: 'Required when type is CYCLIC',
  })
  @IsOptional()
  @IsEnum(CyclePeriod)
  cyclePeriod?: CyclePeriod;

  @ApiPropertyOptional({
    example: 14,
    description: 'Required when cyclePeriod is CUSTOM_DAYS',
  })
  @ValidateIf((o: CreateGoalDto) => o.cyclePeriod === CyclePeriod.CUSTOM_DAYS)
  @IsInt()
  @IsPositive()
  customCycleDays?: number;

  @ApiPropertyOptional({ example: '2025-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-12-31T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    example: 30,
    description: 'Estimated duration in minutes',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  estimatedDurationMinutes?: number;
}
