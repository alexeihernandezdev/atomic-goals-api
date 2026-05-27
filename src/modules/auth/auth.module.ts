import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GetCurrentUserUseCase } from './application/use-cases/get-current-user.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { RefreshTokensUseCase } from './application/use-cases/refresh-tokens.use-case';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { AUTH_TOKENS } from './infrastructure/auth.tokens';
import { BcryptPasswordHasher } from './infrastructure/crypto/bcrypt-password-hasher';
import { UserOrmEntity } from './infrastructure/persistence/user.typeorm-entity';
import { UserTypeOrmRepository } from './infrastructure/persistence/user.typeorm.repository';
import { JwtTokenService } from './infrastructure/tokens/jwt-token.service';
import { AuthController } from './presentation/auth.controller';
import { JwtAuthGuard } from './presentation/guards/jwt-auth.guard';
import { JwtRefreshGuard } from './presentation/guards/jwt-refresh.guard';
import { JwtRefreshStrategy } from './presentation/strategies/jwt-refresh.strategy';
import { JwtStrategy } from './presentation/strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([UserOrmEntity]),
  ],
  controllers: [AuthController],
  providers: [
    RegisterUserUseCase,
    LoginUseCase,
    RefreshTokensUseCase,
    LogoutUseCase,
    GetCurrentUserUseCase,
    JwtStrategy,
    JwtRefreshStrategy,
    JwtRefreshGuard,
    { provide: AUTH_TOKENS.USER_REPOSITORY, useClass: UserTypeOrmRepository },
    { provide: AUTH_TOKENS.PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: AUTH_TOKENS.TOKEN_SERVICE, useClass: JwtTokenService },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AuthModule {}
