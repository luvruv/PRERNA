import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StoresService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.store.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { rating: 'desc' },
    });
  }

  async findById(id: string) {
    const store = await this.prisma.store.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        products: {
          where: { isActive: true },
          include: {
            images: true,
            inventory: true,
            category: true,
          },
        },
      },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return store;
  }

  async findBySlug(slug: string) {
    const store = await this.prisma.store.findUnique({
      where: { slug },
      include: {
        products: {
          where: { isActive: true },
          include: {
            images: true,
            inventory: true,
            category: true,
          },
        },
      },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return store;
  }
}
