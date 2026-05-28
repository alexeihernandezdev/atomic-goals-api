import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class ReorderStepDto {
  @ApiProperty({
    example: 2,
    minimum: 0,
    description: 'New 0-based position for this step',
  })
  @IsInt()
  @Min(0)
  newOrder: number;
}
