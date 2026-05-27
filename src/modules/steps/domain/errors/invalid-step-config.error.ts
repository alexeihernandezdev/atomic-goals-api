import { ValidationError } from '../../../../shared/domain/errors';

export class InvalidStepConfigError extends ValidationError {
  constructor(message: string) {
    super(message);
  }
}
