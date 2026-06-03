import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
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
}
