import { IsInt, IsNumber, IsString, Max, Min } from 'class-validator';

export class StatusOptionDto {
  @IsString()
  id: string;

  @IsString()
  label: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;

  @IsInt()
  @Min(0)
  order: number;
}
