import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, OrderStatus } from '@prisma/client';

@ApiTags('Delivery')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DELIVERY_PARTNER)
@Controller('delivery')
export class DeliveryController {
  constructor(private deliveryService: DeliveryService) {}

  @Get('available')
  @ApiOperation({ summary: 'List available unassigned orders waiting for delivery partner pickup' })
  async getAvailableOrders(@CurrentUser() user: any) {
    return this.deliveryService.getAvailableOrders(user.id);
  }

  @Post('orders/:id/accept')
  @ApiOperation({ summary: 'Delivery partner takes / accepts an available order' })
  async acceptDelivery(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.deliveryService.acceptDelivery(user.id, id);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get current active assignments for delivery partner' })
  async getActiveDeliveries(@CurrentUser() user: any) {
    return this.deliveryService.getActiveDeliveries(user.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get past completed deliveries for delivery partner' })
  async getDeliveryHistory(@CurrentUser() user: any) {
    return this.deliveryService.getDeliveryHistory(user.id);
  }

  @Post('location')
  @ApiOperation({ summary: 'Update live GPS coordinates of delivery partner' })
  async updateLocation(
    @CurrentUser() user: any,
    @Body('latitude') latitude: number,
    @Body('longitude') longitude: number,
    @Body('orderId') orderId?: string,
    @Body('heading') heading?: number,
    @Body('speed') speed?: number,
  ) {
    return this.deliveryService.updateLocation(user.id, latitude, longitude, orderId, heading, speed);
  }

  @Patch('orders/:id/status')
  @ApiOperation({ summary: 'Advance delivery status (picked up, out for delivery, delivered)' })
  async updateDeliveryStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
    @Body('notes') notes?: string,
  ) {
    return this.deliveryService.updateDeliveryStatus(user.id, id, status, notes);
  }

  @Patch('availability')
  @ApiOperation({ summary: 'Toggle delivery partner availability on/off' })
  async toggleAvailability(@CurrentUser() user: any) {
    return this.deliveryService.toggleAvailability(user.id);
  }
}
