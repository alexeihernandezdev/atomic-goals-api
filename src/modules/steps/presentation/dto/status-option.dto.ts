import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsString, Max, Min } from 'class-validator';

export class StatusOptionDto {
  @ApiProperty({ example: 'not-started' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'Not Started' })
  @IsString()
  label: string;

  @ApiProperty({ example: 0, minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;

  @ApiProperty({ example: 0, minimum: 0 })
  @IsInt()
  @Min(0)
  order: number;
}
