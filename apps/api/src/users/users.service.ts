import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto, UpdateProfileDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    if (!this.prisma.isConnected) {
      return {
        id: userId,
        email: userId === 'demo-customer-id' ? 'customer@gmail.com' : 'merchant@gmail.com',
        name: userId === 'demo-customer-id' ? 'Aarav Sharma' : 'Rajesh Kumar (Merchant)',
        phone: '+91 9876543212',
        role: userId === 'demo-customer-id' ? 'CUSTOMER' : 'SHOPKEEPER',
        addresses: [],
      };
    }

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          addresses: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses,
      };
    } catch {
      return {
        id: userId,
        email: 'merchant@gmail.com',
        name: 'Demo User',
        phone: '+91 9876543212',
        role: 'SHOPKEEPER',
        addresses: [],
      };
    }
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (!this.prisma.isConnected) {
      return {
        id: userId,
        email: 'merchant@gmail.com',
        name: dto.name || 'Demo User',
        phone: dto.phone || '+91 9876543212',
        role: 'SHOPKEEPER',
      };
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.phone && { phone: dto.phone }),
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
    };
  }

  async getAddresses(userId: string) {
    if (!this.prisma.isConnected) {
      return [];
    }

    try {
      return await this.prisma.address.findMany({
        where: { userId },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      });
    } catch {
      return [];
    }
  }

  async createAddress(userId: string, dto: CreateAddressDto) {
    if (!this.prisma.isConnected) {
      return {
        id: 'addr-demo-1',
        userId,
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const count = await this.prisma.address.count({ where: { userId } });
    const isFirst = count === 0;

    return this.prisma.address.create({
      data: {
        userId,
        label: dto.label,
        street: dto.street,
        city: dto.city,
        state: dto.state,
        postalCode: dto.postalCode,
        isDefault: dto.isDefault || isFirst,
      },
    });
  }

  async updateAddress(userId: string, addressId: string, dto: CreateAddressDto) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.update({
      where: { id: addressId },
      data: {
        label: dto.label,
        street: dto.street,
        city: dto.city,
        state: dto.state,
        postalCode: dto.postalCode,
        isDefault: dto.isDefault ?? address.isDefault,
      },
    });
  }

  async deleteAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    await this.prisma.address.delete({
      where: { id: addressId },
    });

    return { message: 'Address removed successfully' };
  }

  async setDefaultAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    await this.prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    return this.prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    });
  }
}
