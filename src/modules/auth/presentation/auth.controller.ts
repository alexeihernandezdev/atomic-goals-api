import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { GetCurrentUserUseCase } from '../application/use-cases/get-current-user.use-case';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { LogoutUseCase } from '../application/use-cases/logout.use-case';
import { RefreshTokensUseCase } from '../application/use-cases/refresh-tokens.use-case';
import { RegisterUserUseCase } from '../application/use-cases/register-user.use-case';
import type { User } from '../domain/entities/user.entity';
import {
  CurrentUser,
  type JwtPayload,
  type JwtRefreshPayload,
} from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { clearRefreshCookie, setRefreshCookie } from './helpers/cookie.helper';

function toUserResponse(user: User) {
  return {
    id: user.id.value,
    email: user.email.value,
    name: user.name,
    createdAt: user.createdAt,
  };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokensUseCase: RefreshTokensUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.registerUserUseCase.execute({
      email: dto.email,
      password: dto.password,
      name: dto.name,
    });
    setRefreshCookie(res, tokens.refreshToken);
    return { user: toUserResponse(user), accessToken: tokens.accessToken };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in with email and password' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.loginUseCase.execute({
      email: dto.email,
      password: dto.password,
    });
    setRefreshCookie(res, tokens.refreshToken);
    return { user: toUserResponse(user), accessToken: tokens.accessToken };
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('refresh_token')
  @ApiOperation({ summary: 'Rotate refresh token and get new access token' })
  async refresh(
    @CurrentUser() payload: JwtRefreshPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { tokens } = await this.refreshTokensUseCase.execute({
      userId: payload.userId,
      refreshToken: payload.refreshToken,
    });
    setRefreshCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invalidate refresh token and clear cookie' })
  async logout(
    @CurrentUser() payload: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.logoutUseCase.execute({ userId: payload.userId });
    clearRefreshCookie(res);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get authenticated user profile' })
  async me(@CurrentUser() payload: JwtPayload) {
    const user = await this.getCurrentUserUseCase.execute({
      userId: payload.userId,
    });
    return toUserResponse(user);
  }
}
