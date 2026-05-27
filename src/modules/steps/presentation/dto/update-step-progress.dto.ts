import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateStepProgressDto {
  @IsOptional()
  @IsNumber()
  current?: number;

  @IsOptional()
  @IsBoolean()
  done?: boolean;

  @IsOptional()
  @IsString()
  currentStatusId?: string;
}
