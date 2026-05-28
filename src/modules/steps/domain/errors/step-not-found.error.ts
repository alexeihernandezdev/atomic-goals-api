import { NotFoundError } from '../../../../shared/domain/errors';

export class StepNotFoundError extends NotFoundError {
  constructor(id: string) {
    super(`Step with id "${id}" not found`);
  }
}
