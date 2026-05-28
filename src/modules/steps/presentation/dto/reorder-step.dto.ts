import { IsInt, Min } from 'class-validator';

export class ReorderStepDto {
  @IsInt()
  @Min(0)
  newOrder: number;
}
