import { ValidationError } from '../../../../shared/domain/errors';

export class WeightMustBePositiveError extends ValidationError {
  constructor() {
    super('Step weight must be greater than 0');
  }
}
