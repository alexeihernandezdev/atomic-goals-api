import { Inject, Injectable } from '@nestjs/common';
import type { IPasswordHasher } from '../../domain/ports/password-hasher';
import type {
  ITokenService,
  TokenPair,
} from '../../domain/ports/token-service';
import type { IUserRepository } from '../../domain/ports/user.repository';
import { User } from '../../domain/entities/user.entity';
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';
import { Email } from '../../domain/value-objects/email.vo';
import { AUTH_TOKENS } from '../../infrastructure/auth.tokens';
import type { LoginCommand } from '../commands/login.command';

export interface LoginResult {
  user: User;
  tokens: TokenPair;
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(AUTH_TOKENS.USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
    @Inject(AUTH_TOKENS.PASSWORD_HASHER)
    private readonly passwordHasher: IPasswordHasher,
    @Inject(AUTH_TOKENS.TOKEN_SERVICE)
    private readonly tokenService: ITokenService,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    const email = Email.create(command.email);
    const user = await this.userRepo.findByEmail(email);

    if (!user) throw new InvalidCredentialsError();

    const valid = await this.passwordHasher.compare(
      command.password,
      user.passwordHash,
    );
    if (!valid) throw new InvalidCredentialsError();

    const tokens = this.tokenService.generateTokenPair({
      userId: user.id.value,
      email: user.email.value,
    });

    const refreshTokenHash = await this.passwordHasher.hash(
      tokens.refreshToken,
    );
    user.updateRefreshTokenHash(refreshTokenHash);

    await this.userRepo.save(user);

    return { user, tokens };
  }
}
