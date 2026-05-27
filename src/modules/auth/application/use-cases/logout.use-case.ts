import { Inject, Injectable } from '@nestjs/common';
import type { IUserRepository } from '../../domain/ports/user.repository';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';
import { AUTH_TOKENS } from '../../infrastructure/auth.tokens';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(AUTH_TOKENS.USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(command: { userId: string }): Promise<void> {
    const user = await this.userRepo.findById(Uuid.from(command.userId));
    if (!user) return;

    user.updateRefreshTokenHash(null);
    await this.userRepo.save(user);
  }
}
