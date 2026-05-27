import { ValidationError } from '../../../../shared/domain/errors';

export class InvalidGoalConfigError extends ValidationError {
  constructor(message: string) {
    super(message);
  }
}
