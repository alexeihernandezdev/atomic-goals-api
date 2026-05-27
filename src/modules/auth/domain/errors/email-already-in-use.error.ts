import { ConflictError } from '../../../../shared/domain/errors/conflict.error';

export class EmailAlreadyInUseError extends ConflictError {
  constructor(email: string) {
    super(`Email "${email}" is already registered`);
  }
}
