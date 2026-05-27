import { Inject, Injectable } from '@nestjs/common';
import type { TokenPair } from '../../domain/ports/token-service';
import type { IPasswordHasher } from '../../domain/ports/password-hasher';
import type { ITokenService } from '../../domain/ports/token-service';
import type { IUserRepository } from '../../domain/ports/user.repository';
import { User } from '../../domain/entities/user.entity';
import { EmailAlreadyInUseError } from '../../domain/errors/email-already-in-use.error';
import { Email } from '../../domain/value-objects/email.vo';
import { Password } from '../../domain/value-objects/password.vo';
import { AUTH_TOKENS } from '../../infrastructure/auth.tokens';
import type { RegisterUserCommand } from '../commands/register-user.command';

export interface RegisterUserResult {
  user: User;
  tokens: TokenPair;
}

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(AUTH_TOKENS.USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
    @Inject(AUTH_TOKENS.PASSWORD_HASHER)
    private readonly passwordHasher: IPasswordHasher,
    @Inject(AUTH_TOKENS.TOKEN_SERVICE)
    private readonly tokenService: ITokenService,
  ) {}

  async execute(command: RegisterUserCommand): Promise<RegisterUserResult> {
    const email = Email.create(command.email);
    Password.create(command.password);

    const existing = await this.userRepo.findByEmail(email);
    if (existing) throw new EmailAlreadyInUseError(email.value);

    const passwordHash = await this.passwordHasher.hash(command.password);
    const user = User.create({ email, passwordHash, name: command.name });

    const tokens = this.tokenService.generateTokenPair({
      userId: user.id.value,
      email: email.value,
    });

    const refreshTokenHash = await this.passwordHasher.hash(
      tokens.refreshToken,
    );
    user.updateRefreshTokenHash(refreshTokenHash);

    await this.userRepo.save(user);

    return { user, tokens };
  }
}
