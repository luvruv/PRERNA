import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryMovementType, OrderStatus } from '@prisma/client';

export class CreateProductDto {
  @ApiProperty({ example: 'categoryId' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: 'Fresh Alphonso Mangoes' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Sweet, fragrant seasonal GI-tagged Alphonso mangoes.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 450 })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({ example: 550 })
  @IsNumber()
  @IsPositive()
  mrp: number;

  @ApiProperty({ example: '1 kg (approx 3-4 pcs)' })
  @IsString()
  @IsNotEmpty()
  unit: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/...' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 50, default: 20 })
  @IsNumber()
  @Min(0)
  initialStock?: number = 20;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsNumber()
  @Min(1)
  lowStockThreshold?: number = 10;
}

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsPositive()
  @IsOptional()
  price?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsPositive()
  @IsOptional()
  mrp?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  imageUrl?: string;
}

export class AdjustInventoryDto {
  @ApiProperty({ description: 'Quantity delta to add (positive) or deduct (negative)', example: 15 })
  @IsNumber()
  quantityDelta: number;

  @ApiProperty({ enum: InventoryMovementType, default: InventoryMovementType.RESTOCK })
  @IsEnum(InventoryMovementType)
  type: InventoryMovementType = InventoryMovementType.RESTOCK;

  @ApiPropertyOptional({ example: 'Fresh morning shipment arrival' })
  @IsString()
  @IsOptional()
  reason?: string;
}
