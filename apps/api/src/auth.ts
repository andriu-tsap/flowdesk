import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  CanActivate,
  ExecutionContext,
  SetMetadata,
  Controller,
  Post,
  Body,
  Req,
  Res,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import type { Role } from '@prisma/client';
import { Database } from './prisma';
import { LoginDto } from './dto';
export type Identity = {
  sub: string;
  role: Role;
  name: string;
  employeeId?: string | null;
  customerId?: string | null;
};
export type AuthRequest = Request & { user: Identity };
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
@Injectable()
export class AuthService {
  constructor(
    private db: Database,
    private jwt: JwtService,
  ) {}
  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }
  async issue(
    user: {
      id: string;
      role: Role;
      name: string;
      employeeId: string | null;
      customerId: string | null;
    },
    familyId: string = randomUUID(),
  ) {
    const refresh = randomBytes(48).toString('hex');
    await this.db.refreshSession.create({
      data: {
        userId: user.id,
        hash: this.hash(refresh),
        familyId,
        expiresAt: new Date(Date.now() + 30 * 86400000),
      },
    });
    return {
      accessToken: await this.jwt.signAsync({
        sub: user.id,
        role: user.role,
        name: user.name,
        employeeId: user.employeeId,
        customerId: user.customerId,
      }),
      refresh,
      user: { name: user.name, role: user.role },
    };
  }
  async login(dto: LoginDto) {
    const user = await this.db.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user || !(await compare(dto.password, user.passwordHash)))
      throw new UnauthorizedException('Niepoprawne dane logowania');
    return this.issue(user);
  }
  async rotate(token: string) {
    if (!token) throw new UnauthorizedException();
    const session = await this.db.refreshSession.findUnique({
      where: { hash: this.hash(token) },
      include: { user: true },
    });
    if (!session || session.expiresAt < new Date())
      throw new UnauthorizedException();
    const changed = await this.db.refreshSession.updateMany({
      where: { id: session.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (!changed.count) {
      await this.db.refreshSession.updateMany({
        where: { familyId: session.familyId },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Sesja unieważniona');
    }
    return this.issue(session.user, session.familyId);
  }
  async logout(token: string) {
    if (token)
      await this.db.refreshSession.updateMany({
        where: { hash: this.hash(token) },
        data: { revokedAt: new Date() },
      });
  }
}
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwt: JwtService,
    private reflector: Reflector,
  ) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<AuthRequest>();
    const bearer = req.headers.authorization?.split(' ');
    if (bearer?.[0] !== 'Bearer' || !bearer[1])
      throw new UnauthorizedException();
    try {
      req.user = await this.jwt.verifyAsync<Identity>(bearer[1]);
    } catch {
      throw new UnauthorizedException();
    }
    const roles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (roles && !roles.includes(req.user.role)) throw new ForbiddenException();
    return true;
  }
}
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}
  private cookie(res: Response, value: string) {
    res.cookie('flowdesk_refresh', value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/api/auth',
      maxAge: 30 * 86400000,
    });
  }
  private origin(req: Request) {
    if (req.headers.origin !== process.env.FRONTEND_URL)
      throw new ForbiddenException('Invalid origin');
  }
  @Post('login') async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.origin(req);
    const { refresh, ...result } = await this.auth.login(dto);
    this.cookie(res, refresh);
    return result;
  }
  @Post('refresh') async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.origin(req);
    const { refresh, ...result } = await this.auth.rotate(
      String(req.cookies?.flowdesk_refresh || ''),
    );
    this.cookie(res, refresh);
    return result;
  }
  @Post('logout') async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.origin(req);
    await this.auth.logout(String(req.cookies?.flowdesk_refresh || ''));
    res.clearCookie('flowdesk_refresh', {
      path: '/api/auth',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    return { ok: true };
  }
}
