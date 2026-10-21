import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentService } from './payments/payment.service';
import { CheckoutDto, UpdateOrderStatusDto } from './dto/order.dto';
import { OrderStatus, PaymentStatus, Role, DeliveryStatus } from '@prisma/client';
import { datasetStore } from '../common/dataset-store';
import { inMemoryCarts } from '../cart/cart.service';
import { inMemoryAddresses } from '../users/users.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentService,
  ) {}

  async checkout(userId: string, dto: CheckoutDto) {
    if (!this.prisma.isConnected) {
      const userCart = inMemoryCarts.get(userId) || [];
      const items = userCart.length > 0
        ? userCart.map((i) => ({
            productId: i.productId,
            name: i.productName || 'Fresh Item',
            price: i.price,
            quantity: i.quantity,
            subtotal: i.price * i.quantity,
            unit: i.unit,
          }))
        : [
            {
              productId: 'prod-1',
              name: 'Shimla Fresh Royal Apples',
              price: 180,
              quantity: 1,
              subtotal: 180,
              unit: '1 kg',
            },
          ];

      const subtotal = items.reduce((s, it) => s + it.subtotal, 0);
      const deliveryFee = items.length > 0 ? 25.0 : 0.0;
      const tax = Math.round(subtotal * 0.05 * 100) / 100;
      const totalAmount = Math.round((subtotal + deliveryFee + tax) * 100) / 100;

      let deliveryAddress: any = {
        label: 'Current GPS Location',
        street: 'DLF Cyber City, Sector 25',
        city: 'Gurugram',
        state: 'Haryana',
        postalCode: '122002',
        latitude: 28.4595,
        longitude: 77.0266,
      };

      if (dto.addressData) {
        deliveryAddress = {
          label: dto.addressData.label || 'Delivery Address',
          houseNumber: dto.addressData.houseNumber,
          buildingName: dto.addressData.buildingName,
          road: dto.addressData.road,
          colony: dto.addressData.colony,
          landmark: dto.addressData.landmark,
          street: dto.addressData.street || 'Selected Delivery Location',
          city: dto.addressData.city || 'Gurugram',
          state: dto.addressData.state || 'Haryana',
          postalCode: dto.addressData.postalCode || '122001',
          deliveryInstructions: dto.addressData.deliveryInstructions,
          latitude: dto.addressData.latitude || 28.4595,
          longitude: dto.addressData.longitude || 77.0266,
        };
      } else if (dto.addressId && dto.addressId !== 'gps-current') {
        const userAddresses = inMemoryAddresses.get(userId) || inMemoryAddresses.get('demo-customer-id') || [];
        const foundAddr = userAddresses.find((a: any) => a.id === dto.addressId);
        if (foundAddr) {
          deliveryAddress = {
            label: foundAddr.label || 'Alternate Address',
            street: foundAddr.street,
            city: foundAddr.city || 'Gurugram',
            state: foundAddr.state || 'Haryana',
            postalCode: foundAddr.postalCode || '122002',
            latitude: foundAddr.latitude || 28.4682,
            longitude: foundAddr.longitude || 77.0851,
          };
        }
      }

      const demoOrder = datasetStore.createOrder({
        customer: {
          userId,
          name: 'Prerna Panel Customer',
          email: 'customer@gmail.com',
          phone: '+91 99887 00000',
        },
        deliveryAddress,
        payment: {
          transactionId: `TXN_PAY_${Date.now().toString().slice(-8)}`,
          method: dto.paymentMethod || 'TEST_PAYMENT',
          status: 'COMPLETED',
          paidAt: new Date().toISOString(),
        },
        billing: {
          subtotal,
          deliveryFee,
          tax,
          totalAmount,
        },
        items,
      });

      // Clear the user's in-memory cart
      inMemoryCarts.set(userId, []);

      return {
        id: demoOrder.id,
        orderNumber: demoOrder.orderNumber,
        status: demoOrder.orderStatus,
        total: demoOrder.billing.totalAmount,
        payment: demoOrder.payment,
        deliveryAssignment: demoOrder.deliveryAssignment,
        createdAt: demoOrder.timestamp,
      };
    }

    // 1. Verify address
    const address = await this.prisma.address.findFirst({
      where: { id: dto.addressId, userId },
    });

    if (!address) {
      throw new BadRequestException('Selected delivery address not found');
    }

    // 2. Fetch cart items
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                inventory: true,
                store: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cannot checkout with an empty cart');
    }

    const store = cart.items[0].product.store;
    const storeId = store.id;

    // 2.1 Hyperlocal delivery-radius validation if coordinates are configured
    if (
      address.latitude &&
      address.longitude &&
      store.latitude &&
      store.longitude
    ) {
      const R = 6371; // Earth's radius in km
      const dLat = ((address.latitude - store.latitude) * Math.PI) / 180;
      const dLon = ((address.longitude - store.longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((store.latitude * Math.PI) / 180) *
          Math.cos((address.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceKm = Number((R * c).toFixed(2));
      const deliveryRadius = (store as any).deliveryRadiusKm ?? 10.0;

      if (distanceKm > deliveryRadius) {
        throw new BadRequestException(
          `Your address is ${distanceKm} km away, which exceeds "${store.name}"'s delivery radius of ${deliveryRadius} km. Please select a closer delivery address.`,
        );
      }
    }

    // 3. Server-side totals calculation (Never trust frontend)
    let subtotal = 0;
    for (const item of cart.items) {
      if (!item.product.isActive) {
        throw new BadRequestException(
          `Product "${item.product.name}" is no longer active. Please remove it from cart.`,
        );
      }
      subtotal += item.product.price * item.quantity;
    }

    const deliveryFee = 25.0;
    const tax = Math.round(subtotal * 0.05 * 100) / 100;
    const discount = 0.0;
    const total = Math.round((subtotal + deliveryFee + tax - discount) * 100) / 100;

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `PRN-${dateStr}-${randomSuffix}`;

    // Process payment through PaymentService
    const paymentResult = await this.paymentService.processPayment(
      orderNumber,
      total,
      dto.paymentMethod,
    );

    // 4. Atomic Transaction: Check stock, deduct inventory, create order, items, payment, history, clear cart
    const order = await this.prisma.$transaction(async (tx) => {
      // Check and atomically decrement inventory for all items
      for (const item of cart.items) {
        // Atomically decrement availableQty only if availableQty >= item.quantity
        // This takes an exclusive row write lock in PostgreSQL, ensuring total concurrency safety
        const updateResult = await tx.inventory.updateMany({
          where: {
            productId: item.productId,
            availableQty: { gte: item.quantity },
          },
          data: {
            availableQty: { decrement: item.quantity },
          },
        });

        if (updateResult.count === 0) {
          const inv = await tx.inventory.findUnique({
            where: { productId: item.productId },
          });
          const currStock = inv?.availableQty ?? 0;
          throw new BadRequestException(
            `Insufficient stock for "${item.product.name}". Only ${currStock} available, but you requested ${item.quantity}.`,
          );
        }

        const inventory = await tx.inventory.findUnique({
          where: { productId: item.productId },
        });

        // Record InventoryMovement
        if (inventory) {
          await tx.inventoryMovement.create({
            data: {
              inventoryId: inventory.id,
              quantity: -item.quantity,
              type: 'ORDER_RESERVE',
              reason: `Order ${orderNumber} placed by customer`,
              referenceId: orderNumber,
            },
          });
        }
      }

      // Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: userId,
          storeId,
          addressId: address.id,
          status: OrderStatus.PENDING,
          paymentMethod: dto.paymentMethod,
          paymentStatus: paymentResult.status,
          subtotal,
          deliveryFee,
          tax,
          discount,
          total,
          specialInstructions: dto.specialInstructions,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              productName: item.product.name,
              unitPrice: item.product.price,
              quantity: item.quantity,
              subtotal: item.product.price * item.quantity,
            })),
          },
          payment: {
            create: {
              method: dto.paymentMethod,
              status: paymentResult.status,
              amount: total,
              transactionRef: paymentResult.transactionRef,
              rawResponse: paymentResult.rawResponse,
            },
          },
          statusHistory: {
            create: {
              status: OrderStatus.PENDING,
              changedById: userId,
              notes: 'Order placed by customer',
            },
          },
        },
        include: {
          items: true,
          payment: true,
          statusHistory: true,
          store: true,
          address: true,
        },
      });

      // Clear the user's cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return newOrder;
    });

    return order;
  }

  async findCustomerOrders(userId: string, page = 1, limit = 10) {
    if (!this.prisma.isConnected) {
      const allOrders = datasetStore.getOrders();
      const skip = (page - 1) * limit;
      const items = allOrders.slice(skip, skip + limit).map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.orderStatus,
        total: o.billing?.totalAmount || 250,
        createdAt: o.timestamp,
        store: o.store,
        address: o.deliveryAddress,
        items: o.items.map((i) => ({
          id: `item-${i.productId}`,
          quantity: i.quantity,
          price: i.price,
          product: { name: i.name, images: [] },
        })),
        payment: o.payment,
        deliveryAssignment: o.deliveryAssignment,
        statusHistory: [
          { status: 'CONFIRMED', createdAt: o.timestamp },
          { status: o.orderStatus, createdAt: o.timestamp },
        ],
      }));

      return {
        items,
        total: allOrders.length,
        page,
        limit,
        totalPages: Math.ceil(allOrders.length / limit) || 1,
      };
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { customerId: userId },
        include: {
          items: {
            include: {
              product: {
                include: { images: true },
              },
            },
          },
          store: true,
          deliveryAssignment: {
            include: {
              deliveryPartner: {
                include: { user: true },
              },
            },
          },
          payment: true,
          statusHistory: {
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where: { customerId: userId } }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOrderById(orderId: string, currentUser?: { id: string; role: Role }) {
    if (!this.prisma.isConnected) {
      const found = datasetStore.getOrderById(orderId) || datasetStore.getOrders()[0];
      return {
        id: found.id,
        orderNumber: found.orderNumber,
        deliveryPin: (found as any).deliveryPin || found.orderNumber.replace(/\D/g, '').slice(-4) || '4829',
        status: found.orderStatus,
        total: found.billing?.totalAmount || 285.0,
        createdAt: found.timestamp,
        items: found.items.map((i) => ({
          id: `item-${i.productId}`,
          quantity: i.quantity,
          price: i.price,
          product: { name: i.name, images: [] },
        })),
        customer: found.customer,
        store: found.store,
        address: {
          label: found.deliveryAddress?.label || 'Delivery Location',
          street: found.deliveryAddress?.street || 'DLF Cyber City',
          city: found.deliveryAddress?.city || 'Gurugram',
          state: found.deliveryAddress?.state || 'Haryana',
          postalCode: found.deliveryAddress?.postalCode || '122002',
          latitude: found.deliveryAddress?.latitude || 28.4682,
          longitude: found.deliveryAddress?.longitude || 77.0384,
          fullAddress: `${found.deliveryAddress?.street || ''}, ${found.deliveryAddress?.city || ''}`,
        },
        payment: found.payment,
        deliveryAssignment: {
          deliveryPartner: {
            user: { name: found.deliveryAssignment?.riderName || 'Vikram Singh', phone: found.deliveryAssignment?.riderPhone || '+91 9876543213' },
            currentLat: found.deliveryAssignment?.currentLat || 28.465,
            currentLng: found.deliveryAssignment?.currentLng || 77.0865,
          },
          status: found.deliveryAssignment?.status || 'OUT_FOR_DELIVERY',
        },
      };
    }

    const order = await this.prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
      include: {
        items: {
          include: {
            product: {
              include: { images: true },
            },
          },
        },
        store: true,
        address: true,
        payment: true,
        customer: {
          select: { id: true, name: true, phone: true, email: true },
        },
        deliveryAssignment: {
          include: {
            deliveryPartner: {
              include: { user: true },
            },
            history: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
        statusHistory: {
          include: {
            changedBy: {
              select: { id: true, name: true, role: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (currentUser) {
      if (
        currentUser.role === Role.CUSTOMER &&
        order.customerId !== currentUser.id
      ) {
        throw new ForbiddenException('You do not have access to view this order');
      }
    }

    return order;
  }

  async cancelOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.customerId !== userId) {
      throw new ForbiddenException('Only the customer who placed the order can cancel it');
    }

    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CONFIRMED) {
      throw new BadRequestException(
        `Cannot cancel order at stage ${order.status}. Cancellation only allowed while PENDING or CONFIRMED.`,
      );
    }

    // Atomically cancel and restore stock
    return this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.inventory.update({
          where: { productId: item.productId },
          data: { availableQty: { increment: item.quantity } },
        });

        const inv = await tx.inventory.findUnique({ where: { productId: item.productId } });
        if (inv) {
          await tx.inventoryMovement.create({
            data: {
              inventoryId: inv.id,
              quantity: item.quantity,
              type: 'ORDER_CANCEL',
              reason: `Order ${order.orderNumber} cancelled by customer`,
              referenceId: order.orderNumber,
            },
          });
        }
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          statusHistory: {
            create: {
              status: OrderStatus.CANCELLED,
              changedById: userId,
              notes: 'Order cancelled by customer',
            },
          },
        },
      });

      return updated;
    });
  }

  // State Machine transition validator and executor
  async updateOrderStatus(
    orderId: string,
    targetStatus: OrderStatus,
    currentUser: { id: string; role: Role },
    notes?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        store: { include: { staff: true } },
        deliveryAssignment: {
          include: { deliveryPartner: true },
        },
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const currentStatus = order.status;

    // Define allowed transitions per role
    // Shopkeeper: PENDING -> CONFIRMED, CONFIRMED -> PREPARING, PREPARING -> READY_FOR_PICKUP, PENDING/CONFIRMED -> CANCELLED
    // Admin: READY_FOR_PICKUP -> ASSIGNED
    // Delivery Partner: ASSIGNED -> PICKED_UP, PICKED_UP -> OUT_FOR_DELIVERY, OUT_FOR_DELIVERY -> DELIVERED
    if (currentUser.role === Role.SHOPKEEPER) {
      const isStaff = order.store.staff.some((s) => s.userId === currentUser.id);
      if (!isStaff) {
        throw new ForbiddenException('Shopkeeper can only manage orders for their own store');
      }

      const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
        [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
        [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
        [OrderStatus.PREPARING]: [OrderStatus.READY_FOR_PICKUP],
        [OrderStatus.READY_FOR_PICKUP]: [],
        [OrderStatus.ASSIGNED]: [],
        [OrderStatus.PICKED_UP]: [],
        [OrderStatus.OUT_FOR_DELIVERY]: [],
        [OrderStatus.DELIVERED]: [],
        [OrderStatus.CANCELLED]: [],
      };

      if (!allowedTransitions[currentStatus]?.includes(targetStatus)) {
        throw new BadRequestException(
          `Invalid state transition for Shopkeeper from ${currentStatus} to ${targetStatus}`,
        );
      }
    } else if (currentUser.role === Role.DELIVERY_PARTNER) {
      const partner = order.deliveryAssignment?.deliveryPartner;
      if (!partner || partner.userId !== currentUser.id) {
        throw new ForbiddenException('Delivery partner can only update their own assigned orders');
      }

      const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
        [OrderStatus.ASSIGNED]: [OrderStatus.PICKED_UP],
        [OrderStatus.PICKED_UP]: [OrderStatus.OUT_FOR_DELIVERY],
        [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
        [OrderStatus.PENDING]: [],
        [OrderStatus.CONFIRMED]: [],
        [OrderStatus.PREPARING]: [],
        [OrderStatus.READY_FOR_PICKUP]: [],
        [OrderStatus.DELIVERED]: [],
        [OrderStatus.CANCELLED]: [],
      };

      if (!allowedTransitions[currentStatus]?.includes(targetStatus)) {
        throw new BadRequestException(
          `Invalid state transition for Delivery Partner from ${currentStatus} to ${targetStatus}`,
        );
      }
    } else if (currentUser.role === Role.ADMIN) {
      // Admin can assign or override if needed, but must follow sequential logic
      const validAdminTransitions: OrderStatus[] = [
        OrderStatus.ASSIGNED,
        OrderStatus.CONFIRMED,
        OrderStatus.CANCELLED,
      ];
      if (!validAdminTransitions.includes(targetStatus)) {
        throw new BadRequestException(
          `Admin cannot set arbitrary status ${targetStatus}`,
        );
      }
    } else {
      throw new ForbiddenException('You do not have permission to transition order statuses');
    }

    // Perform transition in transaction
    return this.prisma.$transaction(async (tx) => {
      // If cancelled, restore stock
      if (targetStatus === OrderStatus.CANCELLED) {
        for (const item of order.items) {
          await tx.inventory.update({
            where: { productId: item.productId },
            data: { availableQty: { increment: item.quantity } },
          });

          const inv = await tx.inventory.findUnique({ where: { productId: item.productId } });
          if (inv) {
            await tx.inventoryMovement.create({
              data: {
                inventoryId: inv.id,
                quantity: item.quantity,
                type: 'ORDER_CANCEL',
                reason: `Order rejected/cancelled by ${currentUser.role}`,
                referenceId: order.orderNumber,
              },
            });
          }
        }
      }

      // If moving to DELIVERED, mark COD payment completed
      if (targetStatus === OrderStatus.DELIVERED) {
        await tx.payment.updateMany({
          where: { orderId: order.id },
          data: { status: PaymentStatus.COMPLETED },
        });

        if (order.deliveryAssignment) {
          await tx.deliveryAssignment.update({
            where: { id: order.deliveryAssignment.id },
            data: {
              status: DeliveryStatus.DELIVERED,
              deliveredAt: new Date(),
              history: {
                create: {
                  status: DeliveryStatus.DELIVERED,
                  notes: notes || 'Delivered to customer',
                },
              },
            },
          });
        }
      }

      if (targetStatus === OrderStatus.PICKED_UP && order.deliveryAssignment) {
        await tx.deliveryAssignment.update({
          where: { id: order.deliveryAssignment.id },
          data: {
            status: DeliveryStatus.PICKED_UP,
            pickedUpAt: new Date(),
            history: {
              create: {
                status: DeliveryStatus.PICKED_UP,
                notes: notes || 'Picked up from store',
              },
            },
          },
        });
      }

      if (targetStatus === OrderStatus.OUT_FOR_DELIVERY && order.deliveryAssignment) {
        await tx.deliveryAssignment.update({
          where: { id: order.deliveryAssignment.id },
          data: {
            status: DeliveryStatus.OUT_FOR_DELIVERY,
            history: {
              create: {
                status: DeliveryStatus.OUT_FOR_DELIVERY,
                notes: notes || 'Out for delivery',
              },
            },
          },
        });
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: targetStatus,
          statusHistory: {
            create: {
              status: targetStatus,
              changedById: currentUser.id,
              notes: notes || `Status changed to ${targetStatus}`,
            },
          },
        },
        include: {
          items: true,
          statusHistory: true,
          payment: true,
          deliveryAssignment: true,
        },
      });

      return updatedOrder;
    });
  }
}
