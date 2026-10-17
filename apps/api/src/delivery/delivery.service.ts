import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { TrackingGateway } from './tracking.gateway';
import { OrderStatus, Role, DeliveryStatus } from '@prisma/client';

@Injectable()
export class DeliveryService {
  constructor(
    private prisma: PrismaService,
    private ordersService: OrdersService,
    private trackingGateway: TrackingGateway,
  ) {}

  async getDeliveryPartnerProfile(userId: string) {
    if (!this.prisma.isConnected) {
      return {
        id: 'demo-dp-1',
        userId,
        vehicleType: 'EV Bike',
        vehicleNumber: 'HR-26-EE-1024',
        currentLat: 28.4625,
        currentLng: 77.0892,
        isAvailable: true,
        user: { name: 'Vikram Singh (Rider)', phone: '+91 9876543213' },
      };
    }

    const partner = await this.prisma.deliveryPartner.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!partner) {
      throw new ForbiddenException('Delivery partner profile not found');
    }

    return partner;
  }

  // 1. Available orders waiting for a delivery partner to take/accept
  async getAvailableOrders(userId: string) {
    if (!this.prisma.isConnected) {
      return [];
    }

    const partner = await this.getDeliveryPartnerProfile(userId);

    const orders = await this.prisma.order.findMany({
      where: {
        status: {
          in: [
            OrderStatus.READY_FOR_PICKUP,
            OrderStatus.PREPARING,
            OrderStatus.CONFIRMED,
            OrderStatus.PENDING,
          ],
        },
        deliveryAssignment: null,
      },
      include: {
        items: true,
        store: true,
        address: true,
        customer: {
          select: { name: true, phone: true },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders;
  }

  // 2. Delivery Partner accepts / takes an available delivery request
  async acceptDelivery(userId: string, orderId: string) {
    const partner = await this.getDeliveryPartnerProfile(userId);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { deliveryAssignment: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.deliveryAssignment) {
      throw new BadRequestException('Order is already accepted by another rider');
    }

    // Atomic assignment creation
    const assignment = await this.prisma.$transaction(async (tx) => {
      const newAssignment = await tx.deliveryAssignment.create({
        data: {
          orderId: order.id,
          deliveryPartnerId: partner.id,
          status: DeliveryStatus.ASSIGNED,
          assignedAt: new Date(),
          currentLat: partner.currentLat || 28.4595,
          currentLng: partner.currentLng || 77.0266,
          history: {
            create: {
              status: DeliveryStatus.ASSIGNED,
              notes: `Accepted by rider ${partner.user.name}`,
            },
          },
        },
      });

      // Advance order status to ASSIGNED if READY_FOR_PICKUP
      if (order.status === OrderStatus.READY_FOR_PICKUP || order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.PENDING) {
        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.ASSIGNED },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: OrderStatus.ASSIGNED,
            changedById: userId,
            notes: `Delivery request accepted by ${partner.user.name} (${partner.vehicleNumber || 'Rider'})`,
          },
        });
      }

      return newAssignment;
    });

    return assignment;
  }

  // 3. Active assigned deliveries for this partner
  async getActiveDeliveries(userId: string) {
    if (!this.prisma.isConnected) {
      return [];
    }

    const partner = await this.getDeliveryPartnerProfile(userId);

    return this.prisma.deliveryAssignment.findMany({
      where: {
        deliveryPartnerId: partner.id,
        status: { in: [DeliveryStatus.ASSIGNED, DeliveryStatus.PICKED_UP, DeliveryStatus.OUT_FOR_DELIVERY] },
      },
      include: {
        order: {
          include: {
            items: true,
            store: true,
            address: true,
            customer: {
              select: { name: true, phone: true },
            },
            payment: true,
            statusHistory: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 4. Update live GPS coordinates of rider
  async updateLocation(userId: string, latitude: number, longitude: number, orderId?: string) {
    const partner = await this.getDeliveryPartnerProfile(userId);

    // Update partner coordinates
    await this.prisma.deliveryPartner.update({
      where: { id: partner.id },
      data: {
        currentLat: latitude,
        currentLng: longitude,
        lastLocationAt: new Date(),
      },
    });

    // Also update any active delivery assignments for this rider
    if (orderId) {
      await this.prisma.deliveryAssignment.updateMany({
        where: { orderId, deliveryPartnerId: partner.id },
        data: {
          currentLat: latitude,
          currentLng: longitude,
        },
      });

      this.trackingGateway.broadcastRiderLocation(orderId, {
        latitude,
        longitude,
        updatedAt: new Date().toISOString(),
      });
    } else {
      const activeAssignments = await this.prisma.deliveryAssignment.findMany({
        where: {
          deliveryPartnerId: partner.id,
          status: { in: [DeliveryStatus.ASSIGNED, DeliveryStatus.PICKED_UP, DeliveryStatus.OUT_FOR_DELIVERY] },
        },
      });

      await this.prisma.deliveryAssignment.updateMany({
        where: {
          deliveryPartnerId: partner.id,
          status: { in: [DeliveryStatus.ASSIGNED, DeliveryStatus.PICKED_UP, DeliveryStatus.OUT_FOR_DELIVERY] },
        },
        data: {
          currentLat: latitude,
          currentLng: longitude,
        },
      });

      for (const assign of activeAssignments) {
        this.trackingGateway.broadcastRiderLocation(assign.orderId, {
          latitude,
          longitude,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return {
      success: true,
      latitude,
      longitude,
      updatedAt: new Date(),
    };
  }

  async getDeliveryHistory(userId: string) {
    const partner = await this.getDeliveryPartnerProfile(userId);

    return this.prisma.deliveryAssignment.findMany({
      where: {
        deliveryPartnerId: partner.id,
        status: DeliveryStatus.DELIVERED,
      },
      include: {
        order: {
          include: {
            items: true,
            store: true,
            address: true,
            customer: {
              select: { name: true, phone: true },
            },
            payment: true,
          },
        },
      },
      orderBy: { deliveredAt: 'desc' },
    });
  }

  async updateDeliveryStatus(
    userId: string,
    orderId: string,
    targetStatus: OrderStatus,
    notes?: string,
  ) {
    return this.ordersService.updateOrderStatus(
      orderId,
      targetStatus,
      { id: userId, role: Role.DELIVERY_PARTNER },
      notes,
    );
  }

  async toggleAvailability(userId: string) {
    const partner = await this.getDeliveryPartnerProfile(userId);

    return this.prisma.deliveryPartner.update({
      where: { id: partner.id },
      data: { isAvailable: !partner.isAvailable },
    });
  }
}
