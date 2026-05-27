import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { CyclePeriod } from '../../domain/enums/cycle-period.enum';

export class UpdateGoalDto {
  @ApiPropertyOptional({ example: 'Run 5k every day' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({
    example: 'Build a daily running habit',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ enum: CyclePeriod, example: CyclePeriod.WEEKLY })
  @IsOptional()
  @IsEnum(CyclePeriod)
  cyclePeriod?: CyclePeriod;

  @ApiPropertyOptional({ example: 14 })
  @IsOptional()
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

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  estimatedDurationMinutes?: number;
}
