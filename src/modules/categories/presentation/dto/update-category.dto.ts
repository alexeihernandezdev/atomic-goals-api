import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsHexColor,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Health', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'All health-related goals', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @ApiPropertyOptional({ example: '#4CAF50', nullable: true })
  @IsOptional()
  @IsHexColor()
  color?: string | null;

  @ApiPropertyOptional({ example: 'heart', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string | null;
}
