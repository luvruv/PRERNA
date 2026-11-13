import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { TrackingGateway } from './tracking.gateway';
import { OrderStatus, Role, DeliveryStatus, Prisma } from '@prisma/client';
import { datasetStore, type DatasetOrder } from '../common/dataset-store';

/** Orders a delivery partner may claim (nothing assigned yet, not cancelled/delivered). */
const ACCEPTABLE_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY_FOR_PICKUP,
];

@Injectable()
export class DeliveryService {
  constructor(
    private prisma: PrismaService,
    private ordersService: OrdersService,
    private trackingGateway: TrackingGateway,
  ) {}

  private toRiderOrder(order: DatasetOrder) {
    const store = datasetStore.getStoreById(order.store.storeId);

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.orderStatus,
      total: order.billing?.totalAmount ?? 0,
      createdAt: order.timestamp,
      customer: order.customer,
      address: order.deliveryAddress,
      store: {
        ...order.store,
        ...(store || {}),
        latitude: store?.latitude ?? order.store.latitude,
        longitude: store?.longitude ?? order.store.longitude,
        phone: store?.phone,
      },
      items: order.items.map((item) => ({
        id: `item-${item.productId}`,
        quantity: item.quantity,
        productName: item.name,
        subtotal: item.subtotal,
      })),
      paymentMethod: order.payment?.method,
    };
  }

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
      return datasetStore
        .getOrders()
        .filter(
          (order) =>
            ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'].includes(order.orderStatus),
        )
        .map((order) => this.toRiderOrder(order));
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
    if (!this.prisma.isConnected) {
      const order = datasetStore.getOrderById(orderId);
      if (!order) {
        throw new NotFoundException('Order not found');
      }
      if (!['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'].includes(order.orderStatus)) {
        throw new ConflictException('Order is already accepted by another rider');
      }
      const store = datasetStore.getStoreById(order.store.storeId);
      const assignedAt = new Date().toISOString();
      order.orderStatus = 'ASSIGNED';
      order.deliveryAssignment = {
        riderName: 'Vikram Singh (Rider)',
        riderPhone: '+91 9876543213',
        vehicle: 'EV Bike (HR-26-EE-1024)',
        status: 'ASSIGNED',
        assignedAt,
        currentLat: store?.latitude ?? 28.4595,
        currentLng: store?.longitude ?? 77.0266,
        estimatedDeliveryMins: 5,
      };
      return {
        id: `assign-${order.id}`,
        orderId: order.id,
        status: 'ASSIGNED',
        assignedAt,
        currentLat: order.deliveryAssignment.currentLat,
        currentLng: order.deliveryAssignment.currentLng,
      };
    }

    const partner = await this.getDeliveryPartnerProfile(userId);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        customerId: true,
        orderNumber: true,
        store: { select: { latitude: true, longitude: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const alreadyTakenMessage = 'Order is already accepted by another rider';

    // Atomic assignment: the conditional UPDATE below only succeeds for ONE caller.
    // PostgreSQL row-locks the order, so a concurrent second accept re-evaluates the
    // WHERE clause after the first commits, sees status ASSIGNED and matches 0 rows.
    // The unique index on DeliveryAssignment.orderId is a second line of defence.
    let assignment;
    try {
      assignment = await this.prisma.$transaction(async (tx) => {
        const claim = await tx.order.updateMany({
          where: {
            id: orderId,
            status: { in: ACCEPTABLE_ORDER_STATUSES },
            deliveryAssignment: { is: null },
          },
          data: { status: OrderStatus.ASSIGNED },
        });

        if (claim.count !== 1) {
          throw new ConflictException(alreadyTakenMessage);
        }

        const newAssignment = await tx.deliveryAssignment.create({
          data: {
            orderId,
            deliveryPartnerId: partner.id,
            status: DeliveryStatus.ASSIGNED,
            assignedAt: new Date(),
            // Last known rider GPS (may be null). The real starting point is captured
            // right after acceptance via POST /delivery/location - never the store.
            currentLat: order.store.latitude ?? null,
            currentLng: order.store.longitude ?? null,
            history: {
              create: {
                status: DeliveryStatus.ASSIGNED,
                notes: `Accepted by rider ${partner.user.name}`,
              },
            },
          },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId,
            status: OrderStatus.ASSIGNED,
            changedById: userId,
            notes: `Delivery request accepted by ${partner.user.name} (${partner.vehicleNumber || 'Rider'})`,
          },
        });

        return newAssignment;
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException(alreadyTakenMessage);
      }
      throw err;
    }

    // Real-time notification to the customer (no refresh needed).
    this.trackingGateway.emitOrderAccepted(orderId, {
      status: OrderStatus.ASSIGNED,
      rider: {
        name: partner.user.name,
        phone: partner.user.phone,
        vehicleType: partner.vehicleType,
        vehicleNumber: partner.vehicleNumber,
      },
      latitude: assignment.currentLat,
      longitude: assignment.currentLng,
    });
    this.trackingGateway.emitOrderStatus(orderId, OrderStatus.ASSIGNED);

    // Persisted in-app notification for the customer (non-blocking).
    try {
      await this.prisma.notification.create({
        data: {
          userId: order.customerId,
          title: 'Order Picked!',
          message: `Your delivery partner has accepted order #${order.orderNumber}. Your rider is on the way!`,
          type: 'ORDER_ACCEPTED',
          data: JSON.stringify({ orderId }),
        },
      });
    } catch {
      // notification persistence must never break acceptance
    }

    return assignment;
  }

  // 3. Active assigned deliveries for this partner
  async getActiveDeliveries(userId: string) {
    if (!this.prisma.isConnected) {
      return datasetStore
        .getOrders()
        .filter(
          (order) =>
            !!order.deliveryAssignment &&
            ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(order.orderStatus),
        )
        .map((order) => ({
          id: `assign-${order.id}`,
          orderId: order.id,
          status: order.orderStatus,
          currentLat: order.deliveryAssignment!.currentLat,
          currentLng: order.deliveryAssignment!.currentLng,
          assignedAt: order.deliveryAssignment!.assignedAt || (order.deliveryAssignment!.assignedAt = new Date().toISOString()),
          order: this.toRiderOrder(order),
        }));
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
  async updateLocation(userId: string, latitude: number, longitude: number, orderId?: string, heading: number = 0, speed: number = 0) {
    if (!this.prisma.isConnected) {
      if (orderId) {
        const order = datasetStore.getOrderById(orderId);
        if (order && order.deliveryAssignment) {
          order.deliveryAssignment.currentLat = latitude;
          order.deliveryAssignment.currentLng = longitude;
        }
        this.trackingGateway.broadcastRiderLocation(orderId, {
          latitude,
          longitude,
          heading,
          speed,
          updatedAt: new Date().toISOString(),
        });
      }
      return {
        success: true,
        latitude,
        longitude,
        heading,
        speed,
        updatedAt: new Date(),
      };
    }

    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw new BadRequestException('Valid latitude and longitude are required');
    }

    const partner = await this.getDeliveryPartnerProfile(userId);

    const liveStatuses = [
      DeliveryStatus.ASSIGNED,
      DeliveryStatus.PICKED_UP,
      DeliveryStatus.OUT_FOR_DELIVERY,
    ];

    // Resolve which accepted orders this location belongs to.
    // Rider GPS is NEVER associated with (or broadcast for) an order the partner has not accepted.
    const assignments = await this.prisma.deliveryAssignment.findMany({
      where: {
        deliveryPartnerId: partner.id,
        status: { in: liveStatuses },
        ...(orderId ? { orderId } : {}),
      },
    });

    if (orderId && assignments.length === 0) {
      throw new ForbiddenException('You can only update location for an order you have accepted');
    }

    // Update partner coordinates
    await this.prisma.deliveryPartner.update({
      where: { id: partner.id },
      data: {
        currentLat: latitude,
        currentLng: longitude,
        lastLocationAt: new Date(),
      },
    });

    // Record in location history
    try {
      await this.prisma.driverLocationHistory.create({
        data: {
          driverId: userId,
          orderId: orderId || null,
          latitude,
          longitude,
          heading,
          speed,
        },
      });
    } catch (e) {
      // non-blocking for logging
    }

    if (assignments.length > 0) {
      await this.prisma.deliveryAssignment.updateMany({
        where: { id: { in: assignments.map((a) => a.id) } },
        data: { currentLat: latitude, currentLng: longitude },
      });

      for (const assign of assignments) {
        this.trackingGateway.broadcastRiderLocation(assign.orderId, {
          latitude,
          longitude,
          heading,
          speed,
          source: 'GPS',
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return {
      success: true,
      latitude,
      longitude,
      heading,
      speed,
      updatedAt: new Date(),
    };
  }

  async getDeliveryHistory(userId: string) {
    if (!this.prisma.isConnected) {
      return datasetStore
        .getOrders()
        .filter((order) => order.orderStatus === 'DELIVERED' && !!order.deliveryAssignment)
        .map((order) => ({
          id: `assign-${order.id}`,
          orderId: order.id,
          status: order.deliveryAssignment!.status,
          deliveredAt: order.deliveryAssignment!.deliveredAt,
          assignedAt: order.timestamp,
          order: this.toRiderOrder(order),
        }));
    }

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
    const updated = await this.ordersService.updateOrderStatus(
      orderId,
      targetStatus,
      { id: userId, role: Role.DELIVERY_PARTNER },
      notes,
    );
    // Push the new status to the customer's tracking page in real time.
    this.trackingGateway.emitOrderStatus(orderId, targetStatus);
    return updated;
  }

  async toggleAvailability(userId: string) {
    const partner = await this.getDeliveryPartnerProfile(userId);

    return this.prisma.deliveryPartner.update({
      where: { id: partner.id },
      data: { isAvailable: !partner.isAvailable },
    });
  }
}