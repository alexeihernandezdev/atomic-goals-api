import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateStepProgressDto {
  @ApiPropertyOptional({
    example: 42,
    description: 'New current value for PROGRESS_BAR or COUNTER',
  })
  @IsOptional()
  @IsNumber()
  current?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'New done state for CHECK',
  })
  @IsOptional()
  @IsBoolean()
  done?: boolean;

  @ApiPropertyOptional({
    example: 'in-progress',
    description: 'New active status id for STATUS',
  })
  @IsOptional()
  @IsString()
  currentStatusId?: string;
}
