import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiProperty({ example: 'Home' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ example: 'Flat 402, Sunshine Heights, Sector 14' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ example: 'Gurugram' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Haryana' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ example: '122001' })
  @IsString()
  @IsNotEmpty()
  postalCode: string;

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
