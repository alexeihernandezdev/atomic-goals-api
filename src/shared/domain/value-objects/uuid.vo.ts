import { randomUUID } from 'crypto';

export class Uuid {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static generate(): Uuid {
    return new Uuid(randomUUID());
  }

  static from(value: string): Uuid {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        value,
      )
    ) {
      throw new Error(`Invalid UUID: "${value}"`);
    }
    return new Uuid(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: Uuid): boolean {
    return this.value === other.value;
  }
}
