import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ShopkeeperService } from './shopkeeper.service';
import {
  CreateProductDto,
  UpdateProductDto,
  AdjustInventoryDto,
} from './dto/shopkeeper.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, OrderStatus } from '@prisma/client';

@ApiTags('Shopkeeper')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SHOPKEEPER)
@Controller('shopkeeper')
export class ShopkeeperController {
  constructor(private shopkeeperService: ShopkeeperService) {}

  @Get('store')
  @ApiOperation({ summary: 'Get merchant store profile with location, coordinates, and delivery radius' })
  async getStore(@CurrentUser() user: any) {
    return this.shopkeeperService.getStoreProfile(user.id);
  }

  @Put('store')
  @ApiOperation({ summary: 'Update merchant store location, address, coordinates, and delivery radius' })
  async updateStore(@CurrentUser() user: any, @Body() dto: UpdateStoreDto) {
    return this.shopkeeperService.updateStoreProfile(user.id, dto);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get merchant dashboard with live metrics and recent orders' })
  async getDashboard(@CurrentUser() user: any) {
    return this.shopkeeperService.getDashboard(user.id);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get orders belonging to shopkeeper store' })
  async getOrders(
    @CurrentUser() user: any,
    @Query('status') status?: OrderStatus,
  ) {
    return this.shopkeeperService.getOrders(user.id, status);
  }

  @Patch('orders/:id/status')
  @ApiOperation({ summary: 'Update store order status (accept, prepare, ready, reject)' })
  async updateOrderStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
    @Body('notes') notes?: string,
  ) {
    return this.shopkeeperService.updateOrderStatus(user.id, id, status, notes);
  }

  @Get('products')
  @ApiOperation({ summary: 'List products of shopkeeper store' })
  async getProducts(@CurrentUser() user: any) {
    return this.shopkeeperService.getProducts(user.id);
  }

  @Post('products')
  @ApiOperation({ summary: 'Create new product in shopkeeper store' })
  async createProduct(@CurrentUser() user: any, @Body() dto: CreateProductDto) {
    return this.shopkeeperService.createProduct(user.id, dto);
  }

  @Put('products/:id')
  @ApiOperation({ summary: 'Update product (restricted to own store)' })
  async updateProduct(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.shopkeeperService.updateProduct(user.id, id, dto);
  }

  @Delete('products/:id')
  @ApiOperation({ summary: 'Deactivate product in shopkeeper store' })
  async deleteProduct(@CurrentUser() user: any, @Param('id') id: string) {
    return this.shopkeeperService.deleteProduct(user.id, id);
  }

  @Get('inventory')
  @ApiOperation({ summary: 'Get store inventory and movement logs' })
  async getInventory(@CurrentUser() user: any) {
    return this.shopkeeperService.getInventory(user.id);
  }

  @Patch('inventory/:productId/adjust')
  @ApiOperation({ summary: 'Adjust product stock (creates movement record & audit log)' })
  async adjustInventory(
    @CurrentUser() user: any,
    @Param('productId') productId: string,
    @Body() dto: AdjustInventoryDto,
  ) {
    return this.shopkeeperService.adjustInventory(user.id, productId, dto);
  }
}
