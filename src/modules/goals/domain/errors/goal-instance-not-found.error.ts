import { NotFoundError } from '../../../../shared/domain/errors';

export class GoalInstanceNotFoundError extends NotFoundError {
  constructor(id: string) {
    super(`GoalInstance with id "${id}" not found`);
  }
}
