import { ApiProperty, OmitType } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateStepDto } from './create-step.dto';

// A batch item is a step config without goalInstanceId/order (those are set at
// the batch level). title already carries the day suffix and cycleDay is set.
class CreateStepBatchItemDto extends OmitType(CreateStepDto, [
  'goalInstanceId',
  'order',
] as const) {}

export class CreateStepsBatchDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @IsUUID()
  goalInstanceId: string;

  @ApiProperty({ example: 0, minimum: 0 })
  @IsInt()
  @Min(0)
  baseOrder: number;

  @ApiProperty({ type: [CreateStepBatchItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateStepBatchItemDto)
  steps: CreateStepBatchItemDto[];
}
