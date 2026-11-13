import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { jwtConstants } from '../auth/constants';
import { Logger } from '@nestjs/common';
import { DeliveryStatus, Role } from '@prisma/client';

export type RiderLocationSource = 'GPS' | 'SIMULATION';

export interface RiderLocationPayload {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  /** Real browser GPS vs. the clearly-labelled virtual demo rider. */
  source?: RiderLocationSource;
  /** Route completion percentage (0-100), simulation only. */
  progress?: number;
  /** Remaining road distance in metres, simulation only. */
  remainingMeters?: number;
  /** Customer-facing stage hint, e.g. REACHED_DESTINATION. */
  stage?: string;
  updatedAt: string;
}

/** Delivery statuses in which an assignment is live (rider may stream location). */
const LIVE_ASSIGNMENT_STATUSES: DeliveryStatus[] = [
  DeliveryStatus.ASSIGNED,
  DeliveryStatus.PICKED_UP,
  DeliveryStatus.OUT_FOR_DELIVERY,
];

export const REACHED_DESTINATION_MARKER = 'REACHED_DESTINATION';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/tracking',
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('TrackingGateway');

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Live tracking client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Live tracking client disconnected: ${client.id}`);
  }

  private async authenticateSocket(client: Socket, token?: string) {
    const rawToken =
      token ||
      client.handshake.auth?.token ||
      (client.handshake.headers['authorization'] as string)?.replace('Bearer ', '');

    if (!rawToken) {
      return null;
    }

    try {
      const payload = this.jwtService.verify(rawToken, { secret: jwtConstants.secret });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      return user;
    } catch (e) {
      return null;
    }
  }

  @SubscribeMessage('joinOrderTracking')
  async handleJoinOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; token?: string },
  ) {
    if (!data?.orderId) {
      return { success: false, message: 'orderId is required' };
    }

    const user = await this.authenticateSocket(client, data.token);
    if (!user) {
      return { success: false, message: 'Authentication required to track orders' };
    }

    // Verify order authorization: customer, assigned partner, store owner, or admin
    const order = await this.prisma.order.findUnique({
      where: { id: data.orderId },
      include: {
        deliveryAssignment: {
          include: {
            deliveryPartner: true,
          },
        },
        store: {
          include: { staff: true },
        },
      },
    });

    if (!order) {
      return { success: false, message: 'Order not found' };
    }

    const isCustomer = order.customerId === user.id;
    const isAdmin = user.role === Role.ADMIN;
    const isAssignedRider =
      order.deliveryAssignment?.deliveryPartner?.userId === user.id;
    const isStoreStaff = order.store?.staff?.some((s) => s.userId === user.id);

    if (!isCustomer && !isAdmin && !isAssignedRider && !isStoreStaff) {
      return {
        success: false,
        message: 'Forbidden: You can only track your own active deliveries',
      };
    }

    const room = `order_${data.orderId}`;
    await client.join(room);
    this.logger.log(`User ${user.email} (${user.role}) joined tracking room ${room}`);

    // Rider location is only ever exposed once a delivery partner has accepted the order.
    const assignment = order.deliveryAssignment;
    const hasRiderLocation =
      !!assignment &&
      typeof assignment.currentLat === 'number' &&
      typeof assignment.currentLng === 'number';

    return {
      success: true,
      room,
      accepted: !!assignment,
      status: order.status,
      latestLocation: hasRiderLocation
        ? {
            latitude: assignment!.currentLat,
            longitude: assignment!.currentLng,
            status: order.status,
          }
        : null,
    };
  }

  @SubscribeMessage('leaveOrderTracking')
  async handleLeaveOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string },
  ) {
    if (data?.orderId) {
      await client.leave(`order_${data.orderId}`);
    }
    return { success: true };
  }

  @SubscribeMessage('updateRiderLocation')
  async handleUpdateLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      orderId: string;
      latitude: number;
      longitude: number;
      heading?: number;
      speed?: number;
      source?: RiderLocationSource;
      progress?: number;
      remainingMeters?: number;
      stage?: string;
      token?: string;
    },
  ) {
    if (
      !data?.orderId ||
      typeof data.latitude !== 'number' ||
      typeof data.longitude !== 'number' ||
      !Number.isFinite(data.latitude) ||
      !Number.isFinite(data.longitude)
    ) {
      return {
        success: false,
        message: 'Invalid payload: orderId, latitude, and longitude are required',
      };
    }

    if (data.latitude < -90 || data.latitude > 90 || data.longitude < -180 || data.longitude > 180) {
      return { success: false, message: 'Invalid coordinates' };
    }

    const user = await this.authenticateSocket(client, data.token);
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    if (user.role !== Role.DELIVERY_PARTNER) {
      return {
        success: false,
        message: 'Only the assigned delivery partner can emit location updates',
      };
    }

    // The order must be accepted by THIS partner and still be live.
    const partner = await this.prisma.deliveryPartner.findUnique({
      where: { userId: user.id },
    });
    const assignment = partner
      ? await this.prisma.deliveryAssignment.findFirst({
          where: {
            orderId: data.orderId,
            deliveryPartnerId: partner.id,
            status: { in: LIVE_ASSIGNMENT_STATUSES },
          },
        })
      : null;

    if (!partner || !assignment) {
      return {
        success: false,
        message: 'You can only stream location for an order you have accepted',
      };
    }

    const source: RiderLocationSource = data.source === 'SIMULATION' ? 'SIMULATION' : 'GPS';
    const heading = typeof data.heading === 'number' ? data.heading : 0;
    const progress =
      typeof data.progress === 'number' ? Math.max(0, Math.min(100, data.progress)) : undefined;

    // Persist the latest coordinates. Full history is kept for real GPS only,
    // so the high-frequency virtual simulation never floods the history table.
    try {
      await this.prisma.deliveryAssignment.update({
        where: { id: assignment.id },
        data: {
          currentLat: data.latitude,
          currentLng: data.longitude,
          // Persist the "reached" marker so a customer page refresh still shows it;
          // a demo replay (ON_THE_WAY) clears it again.
          ...(data.stage === REACHED_DESTINATION_MARKER
            ? { notes: REACHED_DESTINATION_MARKER }
            : data.stage === 'ON_THE_WAY' && assignment.notes === REACHED_DESTINATION_MARKER
            ? { notes: null }
            : {}),
        },
      });

      await this.prisma.deliveryPartner.update({
        where: { id: partner.id },
        data: {
          currentLat: data.latitude,
          currentLng: data.longitude,
          lastLocationAt: new Date(),
        },
      });

      if (source === 'GPS') {
        await this.prisma.driverLocationHistory.create({
          data: {
            driverId: user.id,
            orderId: data.orderId,
            latitude: data.latitude,
            longitude: data.longitude,
            heading,
            speed: data.speed || 0,
          },
        });
      }
    } catch (e) {
      this.logger.error(`Failed to persist rider location: ${(e as any).message}`);
    }

    // Broadcast location update to all subscribers in the order room
    this.broadcastRiderLocation(data.orderId, {
      latitude: data.latitude,
      longitude: data.longitude,
      heading,
      speed: data.speed,
      source,
      progress,
      remainingMeters:
        typeof data.remainingMeters === 'number' ? Math.max(0, data.remainingMeters) : undefined,
      stage: typeof data.stage === 'string' ? data.stage : undefined,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  }

  // Called from DeliveryService or the gateway to broadcast to an order room.
  // Callers must only invoke this for orders that have an accepted assignment.
  broadcastRiderLocation(orderId: string, payload: RiderLocationPayload) {
    if (!this.server) return;
    const room = `order_${orderId}`;
    this.server.to(room).emit('riderLocationUpdated', {
      orderId,
      ...payload,
    });
  }

  /** Real-time notification to the customer when a delivery partner accepts the order. */
  emitOrderAccepted(
    orderId: string,
    payload: {
      status: string;
      rider: { name?: string; phone?: string | null; vehicleType?: string | null; vehicleNumber?: string | null };
      latitude?: number | null;
      longitude?: number | null;
    },
  ) {
    if (!this.server) return;
    const room = `order_${orderId}`;
    this.server.to(room).emit('orderAccepted', {
      orderId,
      title: 'Order Picked!',
      message: 'Your delivery partner has accepted your order.',
      subMessage: 'Your rider is on the way!',
      acceptedAt: new Date().toISOString(),
      ...payload,
    });
    this.logger.log(`Order ${orderId} accepted - customer notified in ${room}`);
  }

  /** Real-time order status change (ASSIGNED / PICKED_UP / OUT_FOR_DELIVERY / DELIVERED ...). */
  emitOrderStatus(orderId: string, status: string) {
    if (!this.server) return;
    this.server.to(`order_${orderId}`).emit('orderStatusUpdated', {
      orderId,
      status,
      updatedAt: new Date().toISOString(),
    });
  }
}