import { ConflictError } from '../../../../shared/domain/errors/conflict.error';

export class CategoryNameAlreadyExistsError extends ConflictError {
  constructor(name: string) {
    super(`A category named "${name}" already exists`);
  }
}
