import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../domain/ports/user.repository';
import { Email } from '../../domain/value-objects/email.vo';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';
import { UserMapper } from './user.mapper';
import { UserOrmEntity } from './user.typeorm-entity';

@Injectable()
export class UserTypeOrmRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repo: Repository<UserOrmEntity>,
  ) {}

  async findById(id: Uuid): Promise<User | null> {
    const orm = await this.repo.findOne({ where: { id: id.value } });
    return orm ? UserMapper.toDomain(orm) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const orm = await this.repo.findOne({ where: { email: email.value } });
    return orm ? UserMapper.toDomain(orm) : null;
  }

  async save(user: User): Promise<void> {
    await this.repo.save(UserMapper.toPersistence(user));
  }
}
