import {
  ConflictException,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Admin } from './admin.schema.js';
import type { ChangePasswordDto, LoginDto, UpdateProfileDto } from './auth.schemas.js';
import { hashPassword, verifyPassword } from './password.js';

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(Admin.name) private readonly admins: Model<Admin>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /** Creates the first admin from env vars when the collection is empty. */
  async onApplicationBootstrap() {
    if ((await this.admins.estimatedDocumentCount()) > 0) return;
    const email = this.config.get<string>('ADMIN_EMAIL');
    const password = this.config.get<string>('ADMIN_PASSWORD');
    if (!email || !password) {
      this.logger.warn('No admin exists. Set ADMIN_EMAIL and ADMIN_PASSWORD to create one.');
      return;
    }
    await this.admins.create({
      email,
      name: this.config.get<string>('ADMIN_NAME') ?? 'Admin',
      passwordHash: await hashPassword(password),
    });
    this.logger.log(`Created first admin account: ${email}`);
  }

  async login({ email, password }: LoginDto) {
    const admin = await this.admins.findOne({ email }).select('+passwordHash');
    if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
      throw new UnauthorizedException('Incorrect email or password');
    }
    const accessToken = await this.jwt.signAsync({ sub: admin.id, email: admin.email });
    return { accessToken, admin: this.toPublic(admin) };
  }

  async me(id: string) {
    const admin = await this.admins.findById(id);
    if (!admin) throw new UnauthorizedException();
    return this.toPublic(admin);
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    if (dto.email && (await this.admins.exists({ email: dto.email, _id: { $ne: id } }))) {
      throw new ConflictException('Email already in use');
    }
    const admin = await this.admins.findByIdAndUpdate(id, dto, { returnDocument: 'after' });
    if (!admin) throw new UnauthorizedException();
    return this.toPublic(admin);
  }

  async changePassword(id: string, { currentPassword, newPassword }: ChangePasswordDto) {
    const admin = await this.admins.findById(id).select('+passwordHash');
    if (!admin || !(await verifyPassword(currentPassword, admin.passwordHash))) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    admin.passwordHash = await hashPassword(newPassword);
    await admin.save();
    return { ok: true };
  }

  private toPublic(admin: { id: string; email: string; name: string }) {
    return { id: admin.id, email: admin.email, name: admin.name };
  }
}
