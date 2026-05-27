import { Inject, Injectable } from '@nestjs/common';
import type { IUserRepository } from '../../domain/ports/user.repository';
import { User } from '../../domain/entities/user.entity';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';
import { AUTH_TOKENS } from '../../infrastructure/auth.tokens';

@Injectable()
export class GetCurrentUserUseCase {
  constructor(
    @Inject(AUTH_TOKENS.USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(command: { userId: string }): Promise<User> {
    const user = await this.userRepo.findById(Uuid.from(command.userId));
    if (!user) throw new NotFoundError('User', command.userId);
    return user;
  }
}
