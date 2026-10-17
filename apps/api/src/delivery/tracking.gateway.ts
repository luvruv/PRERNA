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
import { Role } from '@prisma/client';

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

    const latestLat = order.deliveryAssignment?.currentLat ?? 28.4612;
    const latestLng = order.deliveryAssignment?.currentLng ?? 77.0305;

    return {
      success: true,
      room,
      latestLocation: {
        latitude: latestLat,
        longitude: latestLng,
        status: order.status,
      },
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
      speed?: number;
      token?: string;
    },
  ) {
    if (!data?.orderId || typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
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

    if (user.role !== Role.DELIVERY_PARTNER && user.role !== Role.ADMIN) {
      return {
        success: false,
        message: 'Only delivery partners or admins can emit location updates',
      };
    }

    // Persist coordinates in database
    try {
      await this.prisma.deliveryAssignment.updateMany({
        where: { orderId: data.orderId },
        data: {
          currentLat: data.latitude,
          currentLng: data.longitude,
        },
      });

      const partner = await this.prisma.deliveryPartner.findUnique({
        where: { userId: user.id },
      });
      if (partner) {
        await this.prisma.deliveryPartner.update({
          where: { id: partner.id },
          data: {
            currentLat: data.latitude,
            currentLng: data.longitude,
            lastLocationAt: new Date(),
          },
        });
      }
    } catch (e) {
      this.logger.error(`Failed to persist rider location: ${e.message}`);
    }

    // Broadcast location update to all subscribers in the order room
    this.broadcastRiderLocation(data.orderId, {
      latitude: data.latitude,
      longitude: data.longitude,
      speed: data.speed,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  }

  // Method called from DeliveryService or Gateway to broadcast to room
  broadcastRiderLocation(
    orderId: string,
    payload: {
      latitude: number;
      longitude: number;
      speed?: number;
      status?: string;
      updatedAt: string;
    },
  ) {
    if (!this.server) return;
    const room = `order_${orderId}`;
    this.server.to(room).emit('riderLocationUpdated', {
      orderId,
      ...payload,
    });
    this.logger.log(`Broadcasted rider location for ${room}: ${payload.latitude}, ${payload.longitude}`);
  }
}
