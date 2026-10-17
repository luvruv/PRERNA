import { IsNumber, IsOptional, IsBoolean, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NearbyStoresQueryDto {
  @ApiProperty({ description: 'Customer latitude (-90 to 90)', example: 28.4595 })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({ description: 'Customer longitude (-180 to 180)', example: 77.0266 })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @ApiPropertyOptional({ description: 'Filter only stores that deliver to this location', default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true || value === '1')
  @IsBoolean()
  deliverableOnly?: boolean = false;

  @ApiPropertyOptional({ description: 'Optional maximum search radius in kilometers', example: 15 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.5)
  @Max(100)
  radiusKm?: number;
}
