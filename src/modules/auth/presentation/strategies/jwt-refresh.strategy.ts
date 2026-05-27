import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { JwtRefreshPayload } from '../decorators/current-user.decorator';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request): string | null =>
          (req?.cookies as Record<string, string> | undefined)?.refresh_token ??
          null,
      ]),
      secretOrKey: config.get<string>('jwt.refreshSecret') ?? '',
      passReqToCallback: true,
    } as any);
  }

  validate(
    req: Request,
    payload: { sub: string; email: string },
  ): JwtRefreshPayload {
    const refreshToken =
      (req.cookies as Record<string, string> | undefined)?.refresh_token ?? '';
    return { userId: payload.sub, email: payload.email, refreshToken };
  }
}
