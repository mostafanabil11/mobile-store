import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { AUTH_COOKIE, readCookie } from '../common/cookies.js';

export interface AdminTokenPayload {
  sub: string;
  email: string;
}

export type AuthedRequest = Request & { admin: AdminTokenPayload };

/** Protects admin routes. Accepts a Bearer token or the httpOnly admin cookie. */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const header = request.headers.authorization;
    const token = header?.startsWith('Bearer ')
      ? header.slice(7)
      : readCookie(request.headers.cookie, AUTH_COOKIE);

    if (!token) throw new UnauthorizedException();
    try {
      request.admin = await this.jwt.verifyAsync<AdminTokenPayload>(token);
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
