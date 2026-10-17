import { Module } from '@nestjs/common';
import { ShopkeeperService } from './shopkeeper.service';
import { ShopkeeperController } from './shopkeeper.controller';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [OrdersModule],
  controllers: [ShopkeeperController],
  providers: [ShopkeeperService],
  exports: [ShopkeeperService],
})
export class ShopkeeperModule {}
