import { IsEnum } from 'class-validator';
import { GoalInstanceStatus } from '../../domain/enums/goal-instance-status.enum';

export class UpdateGoalInstanceStatusDto {
  @IsEnum(GoalInstanceStatus)
  status: GoalInstanceStatus;
}
