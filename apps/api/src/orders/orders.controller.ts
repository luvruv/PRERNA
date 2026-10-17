import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CheckoutDto, UpdateOrderStatusDto } from './dto/order.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post('checkout')
  @ApiOperation({ summary: 'Place order via single atomic transaction with inventory check & payment' })
  async checkout(@CurrentUser() user: any, @Body() dto: CheckoutDto) {
    return this.ordersService.checkout(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List customer orders with pagination' })
  async findCustomerOrders(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 10;
    return this.ordersService.findCustomerOrders(user.id, p, l);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details and full timeline history' })
  async findOrderById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.ordersService.findOrderById(id, user);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel order (allowed only from PENDING or CONFIRMED state)' })
  async cancelOrder(@CurrentUser() user: any, @Param('id') id: string) {
    return this.ordersService.cancelOrder(id, user.id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status (strictly validated per role state machine)' })
  async updateStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(id, dto.status, user, dto.notes);
  }
}
