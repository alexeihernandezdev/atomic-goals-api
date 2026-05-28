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
  @IsUUID()
  goalInstanceId: string;

  @IsEnum(StepType)
  type: StepType;

  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  weight?: number;

  @IsInt()
  @Min(0)
  order: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @ValidateIf(
    (o: CreateStepDto) =>
      o.type === StepType.PROGRESS_BAR || o.type === StepType.COUNTER,
  )
  @IsNumber()
  @Min(0)
  current?: number;

  @ValidateIf((o: CreateStepDto) => o.type === StepType.PROGRESS_BAR)
  @IsNumber()
  @IsPositive()
  target?: number;

  @ValidateIf((o: CreateStepDto) => o.type === StepType.COUNTER)
  @IsNumber()
  max?: number;

  @IsOptional()
  @IsNumber()
  min?: number;

  @IsOptional()
  @IsBoolean()
  done?: boolean;

  @ValidateIf((o: CreateStepDto) => o.type === StepType.STATUS)
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StatusOptionDto)
  statuses?: StatusOptionDto[];

  @ValidateIf((o: CreateStepDto) => o.type === StepType.STATUS)
  @IsString()
  currentStatusId?: string;

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
