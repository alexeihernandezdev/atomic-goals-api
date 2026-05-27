import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';
import { UserOrmEntity } from './user.typeorm-entity';

export class UserMapper {
  static toDomain(orm: UserOrmEntity): User {
    return User.reconstitute({
      id: Uuid.from(orm.id),
      email: Email.fromPersistence(orm.email),
      passwordHash: orm.passwordHash,
      name: orm.name,
      refreshTokenHash: orm.refreshTokenHash,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(user: User): Partial<UserOrmEntity> {
    return {
      id: user.id.value,
      email: user.email.value,
      passwordHash: user.passwordHash,
      name: user.name,
      refreshTokenHash: user.refreshTokenHash,
    };
  }
}
