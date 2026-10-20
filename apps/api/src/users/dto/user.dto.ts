import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiProperty({ example: 'Home' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiPropertyOptional({ example: 'Flat 402, Tower B' })
  @IsOptional()
  @IsString()
  houseNumber?: string;

  @ApiPropertyOptional({ example: 'Sunshine Heights' })
  @IsOptional()
  @IsString()
  buildingName?: string;

  @ApiProperty({ example: 'MG Road' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiPropertyOptional({ example: 'DLF Phase 2' })
  @IsOptional()
  @IsString()
  colony?: string;

  @ApiPropertyOptional({ example: 'Near Metro Station' })
  @IsOptional()
  @IsString()
  landmark?: string;

  @ApiProperty({ example: 'Gurugram' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Haryana' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ example: '122002' })
  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @ApiPropertyOptional({ default: 'HOME' })
  @IsOptional()
  @IsString()
  addressType?: string;

  @ApiPropertyOptional({ example: 'Leave at security gate' })
  @IsOptional()
  @IsString()
  deliveryInstructions?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ example: 28.4595 })
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ example: 77.0266 })
  @IsOptional()
  longitude?: number;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Priya Sharma' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '+91 99887 76655' })
  @IsOptional()
  @IsString()
  phone?: string;
}
