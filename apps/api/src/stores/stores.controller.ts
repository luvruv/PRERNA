import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { StoresService } from './stores.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Stores')
@Controller('stores')
export class StoresController {
  constructor(private storesService: StoresService) {}

  @Public()
  @Get('nearby')
  @ApiOperation({ summary: 'Find nearby stores based on customer GPS latitude & longitude' })
  @ApiQuery({ name: 'lat', required: true, type: Number })
  @ApiQuery({ name: 'lng', required: true, type: Number })
  @ApiQuery({ name: 'radius', required: false, type: Number })
  async findNearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius?: string,
  ) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const maxRadiusKm = radius ? parseFloat(radius) : 25;

    if (isNaN(latitude) || isNaN(longitude)) {
      return {
        customerLocation: null,
        searchRadiusKm: maxRadiusKm,
        totalNearby: 0,
        stores: [],
        error: 'Invalid coordinates provided',
      };
    }

    return this.storesService.findNearby(latitude, longitude, maxRadiusKm);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all active grocery stores' })
  async findAll() {
    return this.storesService.findAll();
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
