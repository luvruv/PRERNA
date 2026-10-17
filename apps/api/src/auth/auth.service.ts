import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto, ResetPasswordDto } from './dto/auth.dto';
import { Role } from '@prisma/client';
import { jwtConstants } from './constants';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new BadRequestException('An account with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        name: dto.name,
        phone: dto.phone,
        role: Role.CUSTOMER,
        cart: {
          create: {},
        },
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    const refreshTokenExpiresAt = new Date();
    refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7);
    await this.prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: refreshTokenExpiresAt,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const emailKey = dto.email.toLowerCase();
    const demoAccounts: Record<string, any> = {
      'merchant@gmail.com': {
        id: 'demo-merchant-id',
        name: 'Rajesh Kumar (Merchant)',
        email: 'merchant@gmail.com',
        phone: '+91 9876543212',
        role: Role.SHOPKEEPER,
        store: {
          id: 'demo-store-1',
          name: 'Prerna Fresh Mart - DLF Phase 4',
          slug: 'prerna-fresh-mart-dlf-phase-4',
          address: 'Shop 12, Galleria Market, DLF Phase 4, Gurugram',
          city: 'Gurugram',
          state: 'Haryana',
          postalCode: '122002',
          latitude: 28.4682,
          longitude: 77.0851,
          deliveryRadiusKm: 8,
          isActive: true,
          rating: 4.8,
        },
        deliveryPartner: null,
      },
      'customer@gmail.com': {
        id: 'demo-customer-id',
        name: 'Aarav Sharma',
        email: 'customer@gmail.com',
        phone: '+91 9876543210',
        role: Role.CUSTOMER,
        store: null,
        deliveryPartner: null,
      },
      'deliverypartner@gmail.com': {
        id: 'demo-rider-id',
        name: 'Vikram Singh (Rider)',
        email: 'deliverypartner@gmail.com',
        phone: '+91 9876543213',
        role: Role.DELIVERY_PARTNER,
        store: null,
        deliveryPartner: {
          id: 'demo-dp-1',
          vehicleType: 'EV Bike',
          vehicleNumber: 'HR-26-EE-1024',
          currentLat: 28.4625,
          currentLng: 77.0892,
          isAvailable: true,
        },
      },
      'admin@gmail.com': {
        id: 'demo-admin-id',
        name: 'System Administrator',
        email: 'admin@gmail.com',
        phone: '+91 9876543211',
        role: Role.ADMIN,
        store: null,
        deliveryPartner: null,
      },
    };

    if (!this.prisma.isConnected) {
      if (demoAccounts[emailKey] && dto.password === '2026@prerna') {
        const demoUser = demoAccounts[emailKey];
        const tokens = await this.generateTokens(demoUser.id, demoUser.email, demoUser.role);
        return {
          user: demoUser,
          ...tokens,
        };
      }
      throw new UnauthorizedException(
        'Database server is offline at localhost:5432. Please connect PostgreSQL or use University Panel Demo Accounts (password: 2026@prerna).',
      );
    }

    let user: any = null;
    try {
      user = await this.prisma.user.findUnique({
        where: { email: emailKey },
        include: {
          storeStaff: {
            include: { store: true },
          },
          deliveryPartner: true,
        },
      });
    } catch (dbError: any) {
      if (demoAccounts[emailKey] && dto.password === '2026@prerna') {
        const demoUser = demoAccounts[emailKey];
        const tokens = await this.generateTokens(demoUser.id, demoUser.email, demoUser.role);
        return {
          user: demoUser,
          ...tokens,
        };
      }
      throw new UnauthorizedException(
        'Database server is offline at localhost:5432. Please connect PostgreSQL or use University Panel Demo Accounts (password: 2026@prerna).',
      );
    }

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'Your account has been deactivated. Please contact support.',
      );
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    try {
      const refreshTokenExpiresAt = new Date();
      refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7);
      await this.prisma.refreshToken.create({
        data: {
          token: tokens.refreshToken,
          userId: user.id,
          expiresAt: refreshTokenExpiresAt,
        },
      });
    } catch {
      // Continue even if refresh token persistence fails
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        store: user.storeStaff[0]?.store || null,
        deliveryPartner: user.deliveryPartner || null,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: jwtConstants.refreshSecret,
      });

      const stored = await this.prisma.refreshToken.findFirst({
        where: { token: refreshToken, revoked: false },
      });

      if (!stored || stored.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Rotate: revoke old, issue new
      const newTokens = await this.prisma.$transaction(async (tx) => {
        await tx.refreshToken.update({
          where: { token: refreshToken },
          data: { revoked: true },
        });

        const tokens = await this.generateTokens(user.id, user.email, user.role);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await tx.refreshToken.create({
          data: {
            token: tokens.refreshToken,
            userId: user.id,
            expiresAt,
          },
        });
        return tokens;
      });

      return newTokens;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async forgotPassword(email: string) {
    // Generate cryptographically secure token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Always silently proceed (no user enumeration)
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (user) {
      // Invalidate any existing unused tokens for this email
      await this.prisma.passwordResetToken.updateMany({
        where: { email: email.toLowerCase(), used: false },
        data: { used: true },
      });

      await this.prisma.passwordResetToken.create({
        data: {
          tokenHash,
          email: email.toLowerCase(),
          expiresAt,
          used: false,
        },
      });
    }

    const resetLink = `http://localhost:3000/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

    console.log('\n======================================================');
    console.log('🔑 [PASSWORD RESET CONSOLE]');
    console.log(`User: ${email}`);
    console.log(`Reset Link: ${resetLink}`);
    console.log('======================================================\n');
    this.logger.log(`Password reset link generated for ${email}`);

    return {
      message:
        'If the email exists in our system, a password reset link has been dispatched.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(dto.token)
      .digest('hex');

    const resetRecord = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (
      !resetRecord ||
      resetRecord.used ||
      resetRecord.expiresAt < new Date() ||
      resetRecord.email.toLowerCase() !== dto.email.toLowerCase()
    ) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    // Update password and mark token as used atomically
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { tokenHash },
        data: { used: true },
      }),
      // Revoke all existing refresh tokens (force re-login)
      this.prisma.refreshToken.updateMany({
        where: { userId: user.id, revoked: false },
        data: { revoked: true },
      }),
    ]);

    this.logger.log(`Password reset successful for ${dto.email}`);

    return { message: 'Password has been reset successfully. Please log in with your new password.' };
  }

  async getMe(userId: string) {
    if (!this.prisma.isConnected) {
      if (userId === 'demo-merchant-id') {
        return {
          id: 'demo-merchant-id',
          email: 'merchant@gmail.com',
          name: 'Rajesh Kumar (Merchant)',
          phone: '+91 9876543212',
          role: Role.SHOPKEEPER,
          addresses: [],
          store: {
            id: 'demo-store-1',
            name: 'Prerna Fresh Mart - DLF Phase 4',
            slug: 'prerna-fresh-mart-dlf-phase-4',
            address: 'Shop 12, Galleria Market, DLF Phase 4, Gurugram',
            city: 'Gurugram',
            state: 'Haryana',
            postalCode: '122002',
            latitude: 28.4682,
            longitude: 77.0851,
            deliveryRadiusKm: 8,
            isActive: true,
            rating: 4.8,
          },
          deliveryPartner: null,
        };
      } else if (userId === 'demo-customer-id') {
        return {
          id: 'demo-customer-id',
          email: 'customer@gmail.com',
          name: 'Aarav Sharma',
          phone: '+91 9876543210',
          role: Role.CUSTOMER,
          addresses: [],
          store: null,
          deliveryPartner: null,
        };
      } else if (userId === 'demo-rider-id') {
        return {
          id: 'demo-rider-id',
          email: 'deliverypartner@gmail.com',
          name: 'Vikram Singh (Rider)',
          phone: '+91 9876543213',
          role: Role.DELIVERY_PARTNER,
          addresses: [],
          store: null,
          deliveryPartner: {
            id: 'demo-dp-1',
            vehicleType: 'EV Bike',
            vehicleNumber: 'HR-26-EE-1024',
            currentLat: 28.4625,
            currentLng: 77.0892,
            isAvailable: true,
          },
        };
      } else {
        return {
          id: 'demo-admin-id',
          email: 'admin@gmail.com',
          name: 'System Administrator',
          phone: '+91 9876543211',
          role: Role.ADMIN,
          addresses: [],
          store: null,
          deliveryPartner: null,
        };
      }
    }

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          addresses: true,
          storeStaff: {
            include: { store: true },
          },
          deliveryPartner: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses,
        store: user.storeStaff[0]?.store || null,
        deliveryPartner: user.deliveryPartner || null,
      };
    } catch {
      // Demo fallback if database unreachable
      if (userId === 'demo-merchant-id') {
        return {
          id: 'demo-merchant-id',
          email: 'merchant@gmail.com',
          name: 'Rajesh Kumar (Merchant)',
          phone: '+91 9876543212',
          role: Role.SHOPKEEPER,
          addresses: [],
          store: {
            id: 'demo-store-1',
            name: 'Prerna Fresh Mart - DLF Phase 4',
            slug: 'prerna-fresh-mart-dlf-phase-4',
            address: 'Shop 12, Galleria Market, DLF Phase 4, Gurugram',
            city: 'Gurugram',
            state: 'Haryana',
            postalCode: '122002',
            latitude: 28.4682,
            longitude: 77.0851,
            deliveryRadiusKm: 8,
            isActive: true,
            rating: 4.8,
          },
          deliveryPartner: null,
        };
      } else if (userId === 'demo-customer-id') {
        return {
          id: 'demo-customer-id',
          email: 'customer@gmail.com',
          name: 'Aarav Sharma',
          phone: '+91 9876543210',
          role: Role.CUSTOMER,
          addresses: [],
          store: null,
          deliveryPartner: null,
        };
      } else if (userId === 'demo-rider-id') {
        return {
          id: 'demo-rider-id',
          email: 'deliverypartner@gmail.com',
          name: 'Vikram Singh (Rider)',
          phone: '+91 9876543213',
          role: Role.DELIVERY_PARTNER,
          addresses: [],
          store: null,
          deliveryPartner: {
            id: 'demo-dp-1',
            vehicleType: 'EV Bike',
            vehicleNumber: 'HR-26-EE-1024',
            currentLat: 28.4625,
            currentLng: 77.0892,
            isAvailable: true,
          },
        };
      } else {
        return {
          id: 'demo-admin-id',
          email: 'admin@gmail.com',
          name: 'System Administrator',
          phone: '+91 9876543211',
          role: Role.ADMIN,
          addresses: [],
          store: null,
          deliveryPartner: null,
        };
      }
    }
  }

  async revokeRefreshToken(token: string) {
    await this.prisma.refreshToken.updateMany({
      where: { token, revoked: false },
      data: { revoked: true },
    });
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: jwtConstants.secret,
      expiresIn: '1h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: jwtConstants.refreshSecret,
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
