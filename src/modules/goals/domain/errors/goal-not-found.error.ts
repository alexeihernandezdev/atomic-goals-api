import { NotFoundError } from '../../../../shared/domain/errors';

export class GoalNotFoundError extends NotFoundError {
  constructor(id: string) {
    super(`Goal with id "${id}" not found`);
  }
}
