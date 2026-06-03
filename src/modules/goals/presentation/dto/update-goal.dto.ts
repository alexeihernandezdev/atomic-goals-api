import { ApiPropertyOptional } from '@nestjs/swagger';
import {
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
}
