import { ValidationError } from '../../../../shared/domain/errors/validation.error';

export class Email {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(raw: string): Email {
    const normalized = raw.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new ValidationError(`Invalid email address: "${raw}"`);
    }
    return new Email(normalized);
  }

  static fromPersistence(value: string): Email {
    return new Email(value);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
