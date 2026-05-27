import { Inject, Injectable } from '@nestjs/common';
import type { IPasswordHasher } from '../../domain/ports/password-hasher';
import type {
  ITokenService,
  TokenPair,
} from '../../domain/ports/token-service';
import type { IUserRepository } from '../../domain/ports/user.repository';
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';
import { AUTH_TOKENS } from '../../infrastructure/auth.tokens';
import type { RefreshTokensCommand } from '../commands/refresh-tokens.command';

export interface RefreshTokensResult {
  tokens: TokenPair;
}

@Injectable()
export class RefreshTokensUseCase {
  constructor(
    @Inject(AUTH_TOKENS.USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
    @Inject(AUTH_TOKENS.PASSWORD_HASHER)
    private readonly passwordHasher: IPasswordHasher,
    @Inject(AUTH_TOKENS.TOKEN_SERVICE)
    private readonly tokenService: ITokenService,
  ) {}

  async execute(command: RefreshTokensCommand): Promise<RefreshTokensResult> {
    const user = await this.userRepo.findById(Uuid.from(command.userId));
    if (!user || !user.refreshTokenHash) throw new InvalidCredentialsError();

    const valid = await this.passwordHasher.compare(
      command.refreshToken,
      user.refreshTokenHash,
    );
    if (!valid) throw new InvalidCredentialsError();

    const tokens = this.tokenService.generateTokenPair({
      userId: user.id.value,
      email: user.email.value,
    });

    const newHash = await this.passwordHasher.hash(tokens.refreshToken);
    user.updateRefreshTokenHash(newHash);

    await this.userRepo.save(user);

    return { tokens };
  }
}
