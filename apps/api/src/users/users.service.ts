import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto, UpdateProfileDto } from './dto/user.dto';

export const inMemoryAddresses = new Map<string, any[]>([
  [
    'demo-customer-id',
    [
      {
        id: 'addr-demo-home',
        userId: 'demo-customer-id',
        label: 'Home',
        street: 'Flat 402, DLF Phase 4, Galleria Road, Sector 28',
        city: 'Gurugram',
        state: 'Haryana',
        postalCode: '122002',
        latitude: 28.4682,
        longitude: 77.0851,
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'addr-demo-work',
        userId: 'demo-customer-id',
        label: 'Work',
        street: 'Tower B, DLF Cyber City, Sector 25',
        city: 'Gurugram',
        state: 'Haryana',
        postalCode: '122002',
        latitude: 28.4905,
        longitude: 77.0902,
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  ],
]);

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
      if (!inMemoryAddresses.has(userId)) {
        inMemoryAddresses.set(userId, [
          {
            id: `addr-${userId}-home`,
            userId,
            label: 'Home',
            street: 'Flat 402, DLF Phase 4, Galleria Road, Sector 28',
            city: 'Gurugram',
            state: 'Haryana',
            postalCode: '122002',
            latitude: 28.4682,
            longitude: 77.0851,
            isDefault: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);
      }
      return inMemoryAddresses.get(userId) || [];
    }

    try {
      return await this.prisma.address.findMany({
        where: { userId },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      });
    } catch {
      return inMemoryAddresses.get(userId) || [];
    }
  }

  async createAddress(userId: string, dto: CreateAddressDto) {
    if (!this.prisma.isConnected) {
      const list = inMemoryAddresses.get(userId) || [];
      if (dto.isDefault) {
        list.forEach((a) => (a.isDefault = false));
      }
      const newAddr = {
        id: `addr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId,
        label: dto.label || 'Home',
        street: dto.street,
        city: dto.city || 'Gurugram',
        state: dto.state || 'Haryana',
        postalCode: dto.postalCode || '122001',
        latitude: (dto as any).latitude || 28.4682,
        longitude: (dto as any).longitude || 77.0851,
        isDefault: dto.isDefault ?? list.length === 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      list.unshift(newAddr);
      inMemoryAddresses.set(userId, list);
      return newAddr;
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
    if (!this.prisma.isConnected) {
      const list = inMemoryAddresses.get(userId) || [];
      const item = list.find((a) => a.id === addressId);
      if (!item) throw new NotFoundException('Address not found');
      if (dto.isDefault) {
        list.forEach((a) => (a.isDefault = false));
      }
      Object.assign(item, {
        label: dto.label ?? item.label,
        street: dto.street ?? item.street,
        city: dto.city ?? item.city,
        state: dto.state ?? item.state,
        postalCode: dto.postalCode ?? item.postalCode,
        latitude: (dto as any).latitude ?? item.latitude,
        longitude: (dto as any).longitude ?? item.longitude,
        isDefault: dto.isDefault ?? item.isDefault,
        updatedAt: new Date().toISOString(),
      });
      return item;
    }

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
    if (!this.prisma.isConnected) {
      const list = inMemoryAddresses.get(userId) || [];
      const filtered = list.filter((a) => a.id !== addressId);
      inMemoryAddresses.set(userId, filtered);
      return { message: 'Address removed successfully' };
    }

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
    if (!this.prisma.isConnected) {
      const list = inMemoryAddresses.get(userId) || [];
      const item = list.find((a) => a.id === addressId);
      if (!item) throw new NotFoundException('Address not found');
      list.forEach((a) => (a.isDefault = a.id === addressId));
      return item;
    }

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
