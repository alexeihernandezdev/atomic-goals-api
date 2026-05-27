import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';
import { Email } from '../value-objects/email.vo';

interface CreateUserProps {
  email: Email;
  passwordHash: string;
  name: string;
}

interface ReconstituteUserProps {
  id: Uuid;
  email: Email;
  passwordHash: string;
  name: string;
  refreshTokenHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private constructor(
    public readonly id: Uuid,
    private _email: Email,
    private _passwordHash: string,
    private _name: string,
    private _refreshTokenHash: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(props: CreateUserProps): User {
    const now = new Date();
    return new User(
      Uuid.generate(),
      props.email,
      props.passwordHash,
      props.name.trim(),
      null,
      now,
      now,
    );
  }

  static reconstitute(props: ReconstituteUserProps): User {
    return new User(
      props.id,
      props.email,
      props.passwordHash,
      props.name,
      props.refreshTokenHash,
      props.createdAt,
      props.updatedAt,
    );
  }

  get email(): Email {
    return this._email;
  }

  get passwordHash(): string {
    return this._passwordHash;
  }

  get name(): string {
    return this._name;
  }

  get refreshTokenHash(): string | null {
    return this._refreshTokenHash;
  }

  updateRefreshTokenHash(hash: string | null): void {
    this._refreshTokenHash = hash;
  }
}
