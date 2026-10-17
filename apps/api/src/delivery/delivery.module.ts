import { Module } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';
import { TrackingGateway } from './tracking.gateway';
import { OrdersModule } from '../orders/orders.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [OrdersModule, AuthModule],
  controllers: [DeliveryController],
  providers: [DeliveryService, TrackingGateway],
  exports: [DeliveryService, TrackingGateway],
})
export class DeliveryModule {}
