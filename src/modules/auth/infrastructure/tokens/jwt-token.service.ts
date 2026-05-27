import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type {
  ITokenService,
  TokenPair,
  TokenPayload,
} from '../../domain/ports/token-service';

@Injectable()
export class JwtTokenService implements ITokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  generateTokenPair(payload: TokenPayload): TokenPair {
    const { userId, email } = payload;

    const accessToken = this.jwtService.sign(
      { sub: userId, email },
      {
        secret: this.config.get<string>('jwt.accessSecret'),

        expiresIn: this.config.get('jwt.accessExpiresIn'),
      },
    );

    const refreshToken = this.jwtService.sign(
      { sub: userId, email },
      {
        secret: this.config.get<string>('jwt.refreshSecret'),

        expiresIn: this.config.get('jwt.refreshExpiresIn'),
      },
    );

    return { accessToken, refreshToken };
  }
}
