import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import {
  CreateProductDto,
  UpdateProductDto,
  AdjustInventoryDto,
} from './dto/shopkeeper.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { OrderStatus, Role } from '@prisma/client';

let inMemoryDemoStore: any = {
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
  createdAt: new Date(),
  updatedAt: new Date(),
};

@Injectable()
export class ShopkeeperService {
  constructor(
    private prisma: PrismaService,
    private ordersService: OrdersService,
  ) {}

  async getShopkeeperStore(userId: string) {
    if (!this.prisma.isConnected) {
      return inMemoryDemoStore;
    }

    try {
      const staff = await this.prisma.storeStaff.findFirst({
        where: { userId },
        include: { store: true },
      });

      if (staff && staff.store) {
        return staff.store;
      }
    } catch {
      // Fallback to in-memory demo store if DB is offline
    }

    return inMemoryDemoStore;
  }

  async getStoreProfile(userId: string) {
    return this.getShopkeeperStore(userId);
  }

  async updateStoreProfile(userId: string, dto: UpdateStoreDto) {
    if (!this.prisma.isConnected) {
      Object.assign(inMemoryDemoStore, {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        address: dto.address,
        city: dto.city,
        state: dto.state,
        postalCode: dto.postalCode,
        ...(dto.phone ? { phone: dto.phone } : {}),
        latitude: dto.latitude,
        longitude: dto.longitude,
        deliveryRadiusKm: dto.deliveryRadiusKm,
        updatedAt: new Date(),
      });
      return inMemoryDemoStore;
    }
    try {
      const store = await this.getShopkeeperStore(userId);

      const updated = await this.prisma.store.update({
        where: { id: store.id },
        data: {
          ...(dto.name ? { name: dto.name } : {}),
          ...(dto.description !== undefined ? { description: dto.description } : {}),
          address: dto.address,
          city: dto.city,
          state: dto.state,
          postalCode: dto.postalCode,
          ...(dto.phone ? { phone: dto.phone } : {}),
          latitude: dto.latitude,
          longitude: dto.longitude,
          deliveryRadiusKm: dto.deliveryRadiusKm,
          ...(dto.bannerUrl ? { bannerUrl: dto.bannerUrl } : {}),
          ...(dto.logoUrl ? { logoUrl: dto.logoUrl } : {}),
        },
      });

      try {
        await this.prisma.auditLog.create({
          data: {
            userId,
            action: 'UPDATE_STORE_LOCATION',
            entityType: 'Store',
            entityId: store.id,
            previousState: JSON.stringify({
              latitude: store.latitude,
              longitude: store.longitude,
              deliveryRadiusKm: store.deliveryRadiusKm,
              address: store.address,
            }),
            newState: JSON.stringify({
              latitude: updated.latitude,
              longitude: updated.longitude,
              deliveryRadiusKm: updated.deliveryRadiusKm,
              address: updated.address,
            }),
          },
        });
      } catch {}

      return updated;
    } catch {
      // Offline fallback: Update in-memory demo store
      Object.assign(inMemoryDemoStore, {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        address: dto.address,
        city: dto.city,
        state: dto.state,
        postalCode: dto.postalCode,
        ...(dto.phone ? { phone: dto.phone } : {}),
        latitude: dto.latitude,
        longitude: dto.longitude,
        deliveryRadiusKm: dto.deliveryRadiusKm,
        updatedAt: new Date(),
      });
      return inMemoryDemoStore;
    }
  }

  async getDashboard(userId: string) {
    const store = await this.getShopkeeperStore(userId);

    if (!this.prisma.isConnected) {
      return {
        store: {
          id: store.id,
          name: store.name,
          slug: store.slug,
          address: store.address,
          rating: store.rating,
        },
        metrics: {
          todaysOrdersCount: 6,
          todaysSales: 2450,
          pendingOrdersCount: 2,
          lowStockCount: 3,
          totalProducts: 72,
        },
        recentOrders: [],
      };
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      todaysOrders,
      pendingOrdersCount,
      totalProducts,
      lowStockProducts,
      recentOrders,
    ] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          storeId: store.id,
          createdAt: { gte: startOfDay },
        },
        select: { total: true, status: true },
      }),
      this.prisma.order.count({
        where: {
          storeId: store.id,
          status: OrderStatus.PENDING,
        },
      }),
      this.prisma.product.count({
        where: { storeId: store.id, isActive: true },
      }),
      this.prisma.product.count({
        where: {
          storeId: store.id,
          isActive: true,
          inventory: {
            availableQty: { lte: 10 },
          },
        },
      }),
      this.prisma.order.findMany({
        where: { storeId: store.id },
        include: {
          items: true,
          customer: { select: { name: true, phone: true } },
          statusHistory: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    const todaysSales = todaysOrders
      .filter((o) => o.status !== OrderStatus.CANCELLED)
      .reduce((sum, o) => sum + o.total, 0);

    return {
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug,
        address: store.address,
        rating: store.rating,
      },
      metrics: {
        todaysOrdersCount: todaysOrders.length,
        todaysSales: Math.round(todaysSales * 100) / 100,
        pendingOrdersCount,
        lowStockCount: lowStockProducts,
        totalProducts,
      },
      recentOrders,
    };
  }

  async getOrders(userId: string, status?: OrderStatus) {
    const store = await this.getShopkeeperStore(userId);

    if (!this.prisma.isConnected) {
      return [];
    }

    return this.prisma.order.findMany({
      where: {
        storeId: store.id,
        ...(status && { status }),
      },
      include: {
        items: {
          include: {
            product: { include: { images: true } },
          },
        },
        customer: {
          select: { id: true, name: true, phone: true, email: true },
        },
        address: true,
        payment: true,
        deliveryAssignment: {
          include: {
            deliveryPartner: {
              include: { user: true },
            },
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateOrderStatus(
    userId: string,
    orderId: string,
    status: OrderStatus,
    notes?: string,
  ) {
    return this.ordersService.updateOrderStatus(
      orderId,
      status,
      { id: userId, role: Role.SHOPKEEPER },
      notes,
    );
  }

  async getProducts(userId: string) {
    const store = await this.getShopkeeperStore(userId);

    return this.prisma.product.findMany({
      where: { storeId: store.id },
      include: {
        images: true,
        inventory: true,
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createProduct(userId: string, dto: CreateProductDto) {
    const store = await this.getShopkeeperStore(userId);

    const slug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const existing = await this.prisma.product.findFirst({
      where: { storeId: store.id, slug },
    });

    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    const product = await this.prisma.product.create({
      data: {
        storeId: store.id,
        categoryId: dto.categoryId,
        name: dto.name,
        slug: finalSlug,
        description: dto.description,
        price: dto.price,
        mrp: dto.mrp,
        unit: dto.unit,
        isActive: true,
        images: {
          create: dto.imageUrl
            ? [{ url: dto.imageUrl, isPrimary: true, sortOrder: 0 }]
            : [],
        },
        inventory: {
          create: {
            availableQty: dto.initialStock || 0,
            reservedQty: 0,
            lowStockThreshold: dto.lowStockThreshold || 10,
            movements: {
              create: {
                quantity: dto.initialStock || 0,
                type: 'RESTOCK',
                reason: 'Initial product stock creation',
              },
            },
          },
        },
      },
      include: {
        images: true,
        inventory: true,
        category: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE_PRODUCT',
        entityType: 'Product',
        entityId: product.id,
        newState: JSON.stringify({ name: product.name, price: product.price, stock: dto.initialStock }),
      },
    });

    return product;
  }

  async updateProduct(userId: string, productId: string, dto: UpdateProductDto) {
    const store = await this.getShopkeeperStore(userId);

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Ownership check: Shopkeeper cannot edit another store's product!
    if (product.storeId !== store.id) {
      throw new ForbiddenException('You can only edit products belonging to your own store');
    }

    const previousPrice = product.price;

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.mrp !== undefined && { mrp: dto.mrp }),
        ...(dto.unit && { unit: dto.unit }),
        ...(dto.categoryId && { categoryId: dto.categoryId }),
        ...(dto.imageUrl && {
          images: {
            deleteMany: {},
            create: [{ url: dto.imageUrl, isPrimary: true }],
          },
        }),
      },
      include: {
        images: true,
        inventory: true,
        category: true,
      },
    });

    if (dto.price !== undefined && dto.price !== previousPrice) {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'UPDATE_PRODUCT_PRICE',
          entityType: 'Product',
          entityId: productId,
          previousState: JSON.stringify({ price: previousPrice }),
          newState: JSON.stringify({ price: dto.price }),
        },
      });
    }

    return updated;
  }

  async deleteProduct(userId: string, productId: string) {
    const store = await this.getShopkeeperStore(userId);

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.storeId !== store.id) {
      throw new ForbiddenException('You can only delete products belonging to your own store');
    }

    await this.prisma.product.update({
      where: { id: productId },
      data: { isActive: false },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'DEACTIVATE_PRODUCT',
        entityType: 'Product',
        entityId: productId,
      },
    });

    return { message: 'Product deactivated successfully' };
  }

  async getInventory(userId: string) {
    const store = await this.getShopkeeperStore(userId);

    return this.prisma.inventory.findMany({
      where: {
        product: { storeId: store.id },
      },
      include: {
        product: {
          include: {
            images: true,
            category: true,
          },
        },
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async adjustInventory(userId: string, productId: string, dto: AdjustInventoryDto) {
    const store = await this.getShopkeeperStore(userId);

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { inventory: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.storeId !== store.id) {
      throw new ForbiddenException('You cannot adjust inventory for products of another store');
    }

    let inventory = product.inventory;
    if (!inventory) {
      inventory = await this.prisma.inventory.create({
        data: {
          productId,
          availableQty: 0,
          reservedQty: 0,
        },
      });
    }

    const currentQty = inventory.availableQty;
    const newQty = currentQty + dto.quantityDelta;

    // RULE: Stock can never go negative
    if (newQty < 0) {
      throw new BadRequestException(
        `Stock can never go negative. Current stock is ${currentQty}, cannot adjust by ${dto.quantityDelta}.`,
      );
    }

    const [updatedInventory] = await this.prisma.$transaction([
      this.prisma.inventory.update({
        where: { id: inventory.id },
        data: { availableQty: newQty },
      }),
      this.prisma.inventoryMovement.create({
        data: {
          inventoryId: inventory.id,
          quantity: dto.quantityDelta,
          type: dto.type,
          reason: dto.reason || 'Manual merchant inventory adjustment',
        },
      }),
      this.prisma.auditLog.create({
        data: {
          userId,
          action: 'ADJUST_INVENTORY',
          entityType: 'Inventory',
          entityId: inventory.id,
          previousState: JSON.stringify({ availableQty: currentQty }),
          newState: JSON.stringify({ availableQty: newQty, delta: dto.quantityDelta }),
        },
      }),
    ]);

    return updatedInventory;
  }
}
