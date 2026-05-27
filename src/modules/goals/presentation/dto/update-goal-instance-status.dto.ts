import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { GoalInstanceStatus } from '../../domain/enums/goal-instance-status.enum';

export class UpdateGoalInstanceStatusDto {
  @ApiProperty({
    enum: GoalInstanceStatus,
    example: GoalInstanceStatus.ARCHIVED,
  })
  @IsEnum(GoalInstanceStatus)
  status: GoalInstanceStatus;
}
