import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateStoreDto {
  @ApiPropertyOptional({ example: 'Sunrise Fresh Market' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Handpicked fresh farm produce and essentials.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Shop 14-16, Galleria Market, DLF Phase 4' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'Gurugram' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Haryana' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ example: '122009' })
  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @ApiPropertyOptional({ example: '+91 124 4567890' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 28.4595, description: 'Store latitude (-90 to 90)' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: 77.0266, description: 'Store longitude (-180 to 180)' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({
    example: 10.0,
    description: 'Store delivery coverage radius in kilometers (0.5 km to 50 km)',
    default: 10.0,
  })
  @IsNumber()
  @Min(0.5)
  @Max(50)
  deliveryRadiusKm: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bannerUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  logoUrl?: string;
}
