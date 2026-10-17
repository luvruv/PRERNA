import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';

const inMemoryCarts = new Map<string, any[]>();

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateCart(userId: string) {
    if (!this.prisma.isConnected) {
      return { id: `cart-${userId}`, userId };
    }

    let cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
      });
    }

    return cart;
  }

  async getCart(userId: string) {
    if (!this.prisma.isConnected) {
      const items = inMemoryCarts.get(userId) || [];
      let subtotal = 0;
      let totalItems = 0;

      const formattedItems = items.map((item) => {
        const itemSubtotal = (item.price || 0) * item.quantity;
        subtotal += itemSubtotal;
        totalItems += item.quantity;

        return {
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          productName: item.productName || 'Fresh Grocery Item',
          price: item.price || 50,
          mrp: item.mrp || 60,
          unit: item.unit || '1 pc',
          image: item.image || '',
          store: item.store || { id: 'demo-store-1', name: 'Prerna Fresh Mart - DLF Phase 4' },
          availableQty: item.availableQty || 50,
          subtotal: itemSubtotal,
        };
      });

      const deliveryFee = totalItems > 0 ? 25.0 : 0.0;
      const tax = Math.round(subtotal * 0.05 * 100) / 100;
      const total = Math.round((subtotal + deliveryFee + tax) * 100) / 100;

      return {
        id: `cart-${userId}`,
        items: formattedItems,
        totalItems,
        subtotal,
        deliveryFee,
        tax,
        total,
      };
    }

    const cart = await this.getOrCreateCart(userId);

    const items = await this.prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: {
        product: {
          include: {
            images: true,
            inventory: true,
            store: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let subtotal = 0;
    let totalItems = 0;

    const formattedItems = items.map((item) => {
      const itemSubtotal = item.product.price * item.quantity;
      subtotal += itemSubtotal;
      totalItems += item.quantity;

      return {
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        productName: item.product.name,
        price: item.product.price,
        mrp: item.product.mrp,
        unit: item.product.unit,
        image: item.product.images[0]?.url || '',
        store: item.product.store,
        availableQty: item.product.inventory?.availableQty || 0,
        subtotal: itemSubtotal,
      };
    });

    const deliveryFee = totalItems > 0 ? 25.0 : 0.0;
    const tax = Math.round(subtotal * 0.05 * 100) / 100;
    const total = Math.round((subtotal + deliveryFee + tax) * 100) / 100;

    return {
      id: cart.id,
      items: formattedItems,
      totalItems,
      subtotal,
      deliveryFee,
      tax,
      total,
    };
  }

  async addItem(userId: string, dto: AddToCartDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { inventory: true },
    });

    if (!product || !product.isActive) {
      throw new NotFoundException('Product not found or is currently inactive');
    }

    const available = product.inventory?.availableQty || 0;
    if (available <= 0) {
      throw new BadRequestException('Product is currently out of stock');
    }

    const cart = await this.getOrCreateCart(userId);

    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: dto.productId,
        },
      },
    });

    const newQuantity = (existingItem?.quantity || 0) + dto.quantity;
    if (newQuantity > available) {
      throw new BadRequestException(
        `Cannot add ${dto.quantity} more. Only ${available} units available in stock.`,
      );
    }

    if (existingItem) {
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          quantity: dto.quantity,
        },
      });
    }

    return this.getCart(userId);
  }

  async updateItem(userId: string, cartItemId: string, dto: UpdateCartItemDto) {
    const cart = await this.getOrCreateCart(userId);

    const cartItem = await this.prisma.cartItem.findFirst({
      where: { id: cartItemId, cartId: cart.id },
      include: { product: { include: { inventory: true } } },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    if (dto.quantity <= 0) {
      await this.prisma.cartItem.delete({
        where: { id: cartItemId },
      });
    } else {
      const available = cartItem.product.inventory?.availableQty || 0;
      if (dto.quantity > available) {
        throw new BadRequestException(
          `Requested quantity (${dto.quantity}) exceeds available stock (${available})`,
        );
      }

      await this.prisma.cartItem.update({
        where: { id: cartItemId },
        data: { quantity: dto.quantity },
      });
    }

    return this.getCart(userId);
  }

  async removeItem(userId: string, cartItemId: string) {
    const cart = await this.getOrCreateCart(userId);

    const cartItem = await this.prisma.cartItem.findFirst({
      where: { id: cartItemId, cartId: cart.id },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);

    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return { message: 'Cart cleared successfully' };
  }
}
