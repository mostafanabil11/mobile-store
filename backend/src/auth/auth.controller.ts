import { Body, Controller, Get, HttpCode, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Response } from 'express';
import { AUTH_COOKIE } from '../common/cookies.js';
import { AdminGuard, type AuthedRequest } from './auth.guard.js';
import {
  type ChangePasswordDto,
  changePasswordSchema,
  type LoginDto,
  loginSchema,
  type UpdateProfileDto,
  updateProfileSchema,
} from './auth.schemas.js';
import { AuthService } from './auth.service.js';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(200)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  async login(
    @Body({ schema: loginSchema }) dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.login(dto);
    res.cookie(AUTH_COOKIE, result.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.get('NODE_ENV') === 'production',
      maxAge: WEEK_MS,
      path: '/',
    });
    return result;
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(AUTH_COOKIE, { path: '/' });
    return { ok: true };
  }

  @Get('me')
  @UseGuards(AdminGuard)
  me(@Req() req: AuthedRequest) {
    return this.auth.me(req.admin.sub);
  }

  @Patch('me')
  @UseGuards(AdminGuard)
  updateProfile(@Req() req: AuthedRequest, @Body({ schema: updateProfileSchema }) dto: UpdateProfileDto) {
    return this.auth.updateProfile(req.admin.sub, dto);
  }

  @Patch('password')
  @UseGuards(AdminGuard)
  changePassword(
    @Req() req: AuthedRequest,
    @Body({ schema: changePasswordSchema }) dto: ChangePasswordDto,
  ) {
    return this.auth.changePassword(req.admin.sub, dto);
  }
}
