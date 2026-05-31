import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateStepMetadataDto {
  @ApiPropertyOptional({ example: 'Complete chapter 2' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @ApiPropertyOptional({ example: 'Read pages 31–60', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 2.0 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  weight?: number;

  @ApiPropertyOptional({ example: 1, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({ example: '2025-02-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-04-30T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 45 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  estimatedDurationMinutes?: number;

  @ApiPropertyOptional({ example: '1', description: 'Day within cycle (week day, month day, etc.)' })
  @IsOptional()
  @IsString()
  cycleDay?: string;
}
