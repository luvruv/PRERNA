import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, OrderStatus, DeliveryStatus, Prisma } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getMetrics() {
    const [
      totalUsers,
      totalStores,
      totalProducts,
      totalOrders,
      pendingOrders,
      readyForPickupOrders,
      activeDeliveryPartners,
      ordersForRevenue,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.store.count(),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.order.count({ where: { status: OrderStatus.READY_FOR_PICKUP } }),
      this.prisma.deliveryPartner.count({ where: { isAvailable: true } }),
      this.prisma.order.findMany({
        where: { status: { not: OrderStatus.CANCELLED } },
        select: { total: true },
      }),
    ]);

    const totalRevenue = ordersForRevenue.reduce((acc, o) => acc + o.total, 0);

    return {
      totalUsers,
      totalStores,
      totalProducts,
      totalOrders,
      pendingOrders,
      readyForPickupOrders,
      activeDeliveryPartners,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
    };
  }

  async getUsers(role?: Role, search?: string, page = 1, limit = 20) {
    const where: Prisma.UserWhereInput = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: { orders: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async toggleUserStatus(userId: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: updated.isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
        entityType: 'User',
        entityId: userId,
        previousState: JSON.stringify({ isActive: user.isActive }),
        newState: JSON.stringify({ isActive: updated.isActive }),
      },
    });

    return updated;
  }

  async getOrders(status?: OrderStatus, page = 1, limit = 20) {
    const where: Prisma.OrderWhereInput = {};
    if (status) where.status = status;

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          customer: { select: { name: true, phone: true, email: true } },
          store: { select: { name: true, slug: true } },
          deliveryAssignment: {
            include: {
              deliveryPartner: {
                include: { user: { select: { name: true, phone: true } } },
              },
            },
          },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getDeliveryPartners() {
    return this.prisma.deliveryPartner.findMany({
      include: {
        user: { select: { id: true, name: true, phone: true, email: true, isActive: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async assignDeliveryPartner(
    orderId: string,
    deliveryPartnerId: string,
    adminId: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { deliveryAssignment: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const partner = await this.prisma.deliveryPartner.findUnique({
      where: { id: deliveryPartnerId },
      include: { user: true },
    });

    if (!partner) {
      throw new NotFoundException('Delivery partner not found');
    }

    return this.prisma.$transaction(async (tx) => {
      // Create or update assignment
      if (order.deliveryAssignment) {
        await tx.deliveryAssignment.update({
          where: { id: order.deliveryAssignment.id },
          data: {
            deliveryPartnerId: partner.id,
            status: DeliveryStatus.ASSIGNED,
            assignedAt: new Date(),
          },
        });
      } else {
        await tx.deliveryAssignment.create({
          data: {
            orderId: order.id,
            deliveryPartnerId: partner.id,
            status: DeliveryStatus.ASSIGNED,
            assignedAt: new Date(),
            history: {
              create: {
                status: DeliveryStatus.ASSIGNED,
                notes: `Assigned to ${partner.user.name} by Admin`,
              },
            },
          },
        });
      }

      // Update Order status to ASSIGNED
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.ASSIGNED,
          statusHistory: {
            create: {
              status: OrderStatus.ASSIGNED,
              changedById: adminId,
              notes: `Order assigned to delivery rider ${partner.user.name}`,
            },
          },
        },
        include: {
          deliveryAssignment: {
            include: { deliveryPartner: { include: { user: true } } },
          },
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: 'ASSIGN_DELIVERY_PARTNER',
          entityType: 'Order',
          entityId: order.id,
          previousState: JSON.stringify({ status: order.status }),
          newState: JSON.stringify({
            status: OrderStatus.ASSIGNED,
            deliveryPartnerId: partner.id,
            deliveryPartnerName: partner.user.name,
          }),
        },
      });

      return updatedOrder;
    });
  }

  async getAuditLogs(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        include: {
          user: { select: { name: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count(),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getStores() {
    return this.prisma.store.findMany({
      include: {
        staff: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        _count: {
          select: { products: true, orders: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggleStoreStatus(storeId: string, adminId: string) {
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw new NotFoundException('Store not found');

    const updated = await this.prisma.store.update({
      where: { id: storeId },
      data: { isActive: !store.isActive },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: updated.isActive ? 'ACTIVATE_STORE' : 'DEACTIVATE_STORE',
        entityType: 'Store',
        entityId: storeId,
        previousState: JSON.stringify({ isActive: store.isActive }),
        newState: JSON.stringify({ isActive: updated.isActive }),
      },
    });

    return updated;
  }

  async getCategories() {
    return this.prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createCategory(
    data: { name: string; description?: string; imageUrl?: string },
    adminId: string,
  ) {
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const existing = await this.prisma.category.findUnique({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    const category = await this.prisma.category.create({
      data: {
        name: data.name,
        slug: finalSlug,
        description: data.description,
        imageUrl: data.imageUrl,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'CREATE_CATEGORY',
        entityType: 'Category',
        entityId: category.id,
        newState: JSON.stringify(category),
      },
    });

    return category;
  }
}
