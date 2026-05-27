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
  @IsUUID()
  categoryId: string;

  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(GoalType)
  type: GoalType;

  @IsOptional()
  @IsEnum(CyclePeriod)
  cyclePeriod?: CyclePeriod;

  @ValidateIf((o: CreateGoalDto) => o.cyclePeriod === CyclePeriod.CUSTOM_DAYS)
  @IsInt()
  @IsPositive()
  customCycleDays?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  estimatedDurationMinutes?: number;
}
