import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, OrderStatus } from '@prisma/client';

export class CheckoutDto {
  @ApiProperty({ description: 'Delivery Address ID' })
  @IsString()
  @IsNotEmpty()
  addressId: string;

  @ApiProperty({ enum: PaymentMethod, default: PaymentMethod.COD })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod = PaymentMethod.COD;

  @ApiPropertyOptional({ description: 'Special delivery instructions' })
  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @ApiPropertyOptional({ description: 'Custom/GPS delivery address payload' })
  @IsOptional()
  addressData?: {
    label?: string;
    street: string;
    city?: string;
    state?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
  };
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiPropertyOptional({ description: 'Notes regarding status change' })
  @IsOptional()
  @IsString()
  notes?: string;
}
