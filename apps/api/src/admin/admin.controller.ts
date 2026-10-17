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
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, OrderStatus } from '@prisma/client';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get total platform real metrics' })
  async getMetrics() {
    return this.adminService.getMetrics();
  }

  @Get('users')
  @ApiOperation({ summary: 'List and filter users with pagination' })
  async getUsers(
    @Query('role') role?: Role,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 20;
    return this.adminService.getUsers(role, search, p, l);
  }

  @Patch('users/:id/toggle-status')
  @ApiOperation({ summary: 'Enable or disable a user account' })
  async toggleUserStatus(@CurrentUser() user: any, @Param('id') id: string) {
    return this.adminService.toggleUserStatus(id, user.id);
  }

  @Get('orders')
  @ApiOperation({ summary: 'List all platform orders with optional status filter' })
  async getOrders(
    @Query('status') status?: OrderStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 20;
    return this.adminService.getOrders(status, p, l);
  }

  @Get('delivery-partners')
  @ApiOperation({ summary: 'List all registered delivery partners' })
  async getDeliveryPartners() {
    return this.adminService.getDeliveryPartners();
  }

  @Post('orders/:id/assign-delivery')
  @ApiOperation({ summary: 'Assign a delivery partner to an order' })
  async assignDeliveryPartner(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('deliveryPartnerId') deliveryPartnerId: string,
  ) {
    return this.adminService.assignDeliveryPartner(id, deliveryPartnerId, user.id);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'View paginated audit logs' })
  async getAuditLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 20;
    return this.adminService.getAuditLogs(p, l);
  }

  @Get('stores')
  @ApiOperation({ summary: 'List all stores with staff and inventory counts' })
  async getStores() {
    return this.adminService.getStores();
  }

  @Patch('stores/:id/toggle-status')
  @ApiOperation({ summary: 'Enable or disable a merchant store' })
  async toggleStoreStatus(@CurrentUser() user: any, @Param('id') id: string) {
    return this.adminService.toggleStoreStatus(id, user.id);
  }

  @Get('categories')
  @ApiOperation({ summary: 'List all categories with product counts' })
  async getCategories() {
    return this.adminService.getCategories();
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create new product category' })
  async createCategory(
    @CurrentUser() user: any,
    @Body() body: { name: string; description?: string; imageUrl?: string },
  ) {
    return this.adminService.createCategory(body, user.id);
  }
}
