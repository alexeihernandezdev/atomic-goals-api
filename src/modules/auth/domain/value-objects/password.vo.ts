import { ValidationError } from '../../../../shared/domain/errors/validation.error';

export class Password {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(raw: string): Password {
    if (raw.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }
    return new Password(raw);
  }
}
