import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';

export class TrashEntityNotFoundError extends NotFoundError {
  constructor(entity: string, id: string) {
    super(`${entity} "${id}" not found in trash`);
  }
}
