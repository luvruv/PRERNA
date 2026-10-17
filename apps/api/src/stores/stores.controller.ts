import {
  Controller,
  Get,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StoresService } from './stores.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Stores')
@Controller('stores')
export class StoresController {
  constructor(private storesService: StoresService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all active grocery stores' })
  async findAll() {
    return this.storesService.findAll();
  }

  @Public()
  @Get('nearby')
  @ApiOperation({ summary: 'Find active stores near customer coordinates sorted by distance' })
  async findNearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('deliverableOnly') deliverableOnly?: string,
    @Query('radiusKm') radiusKm?: string,
  ) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new BadRequestException('Valid lat and lng query parameters are required (-90 to 90, -180 to 180)');
    }
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw new BadRequestException('Coordinates out of range (-90 <= lat <= 90, -180 <= lng <= 180)');
    }

    const isDeliverableOnly = deliverableOnly === 'true' || deliverableOnly === '1';
    const maxRadius = radiusKm ? parseFloat(radiusKm) : undefined;

    return this.storesService.getNearbyStores(
      latitude,
      longitude,
      isDeliverableOnly,
      maxRadius,
    );
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get store details by slug' })
  async findBySlug(@Param('slug') slug: string) {
    return this.storesService.findBySlug(slug);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get store details by ID' })
  async findById(@Param('id') id: string) {
    return this.storesService.findById(id);
  }
}
