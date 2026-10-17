import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const fallbackDemoStores = [
  {
    id: 'demo-store-1',
    name: 'Prerna Fresh Mart - DLF Phase 4',
    slug: 'prerna-fresh-mart-dlf-phase-4',
    description: 'Fresh vegetables, dairy, farm fruits & daily essentials',
    address: 'Shop 12, Galleria Market, DLF Phase 4, Gurugram',
    city: 'Gurugram',
    state: 'Haryana',
    postalCode: '122002',
    phone: '+91 9876543212',
    latitude: 28.4682,
    longitude: 77.0851,
    deliveryRadiusKm: 8.0,
    isActive: true,
    rating: 4.8,
    bannerUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80',
    logoUrl: null,
    _count: { products: 72 },
  },
  {
    id: 'demo-store-2',
    name: 'Prerna Organic & Daily - Sector 14',
    slug: 'prerna-organic-daily-sector-14',
    description: 'Certified organic vegetables, cold-pressed oils & whole grains',
    address: 'SCF 45, Sector 14 Main Market, Gurugram',
    city: 'Gurugram',
    state: 'Haryana',
    postalCode: '122001',
    phone: '+91 9876543214',
    latitude: 28.4721,
    longitude: 77.0428,
    deliveryRadiusKm: 6.0,
    isActive: true,
    rating: 4.6,
    bannerUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
    logoUrl: null,
    _count: { products: 68 },
  },
  {
    id: 'demo-store-3',
    name: 'Prerna Super Express - Golf Course Rd',
    slug: 'prerna-super-express-golf-course',
    description: '10-minute lightning delivery hub for DLF 5, Horizon & Mega Mall',
    address: 'Lower Ground, Mega Mall, Golf Course Road, Gurugram',
    city: 'Gurugram',
    state: 'Haryana',
    postalCode: '122002',
    phone: '+91 9876543215',
    latitude: 28.4412,
    longitude: 77.1025,
    deliveryRadiusKm: 10.0,
    isActive: true,
    rating: 4.9,
    bannerUrl: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=800&q=80',
    logoUrl: null,
    _count: { products: 68 },
  },
];

@Injectable()
export class StoresService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    if (!this.prisma.isConnected) {
      return fallbackDemoStores;
    }

    try {
      return await this.prisma.store.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: { products: true },
          },
        },
        orderBy: { rating: 'desc' },
      });
    } catch {
      return fallbackDemoStores;
    }
  }

  async findById(id: string) {
    if (!this.prisma.isConnected) {
      const fallback = fallbackDemoStores.find((s) => s.id === id || s.slug === id);
      if (!fallback) {
        throw new NotFoundException('Store not found');
      }
      return { ...fallback, products: [] };
    }

    try {
      const store = await this.prisma.store.findFirst({
        where: {
          OR: [{ id }, { slug: id }],
        },
        include: {
          products: {
            where: { isActive: true },
            include: {
              images: true,
              inventory: true,
              category: true,
            },
          },
        },
      });

      if (store) return store;
    } catch {
      // ignore
    }

    const fallback = fallbackDemoStores.find((s) => s.id === id || s.slug === id);
    if (!fallback) {
      throw new NotFoundException('Store not found');
    }
    return { ...fallback, products: [] };
  }

  async findBySlug(slug: string) {
    return this.findById(slug);
  }

  async getNearbyStores(
    lat: number,
    lng: number,
    deliverableOnly = false,
    radiusKm?: number,
  ) {
    let stores: any[] = [];
    if (!this.prisma.isConnected) {
      stores = fallbackDemoStores;
    } else {
      try {
        stores = await this.prisma.store.findMany({
          where: { isActive: true },
          include: {
            _count: {
              select: { products: true },
            },
          },
        });
      } catch {
        stores = fallbackDemoStores;
      }
    }

    const R = 6371; // Earth's mean radius in km
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const storesWithDistance = stores.map((store) => {
      const sLat = store.latitude ?? 28.4595;
      const sLng = store.longitude ?? 77.0266;
      const deliveryRadius = store.deliveryRadiusKm ?? 10.0;

      const dLat = toRad(sLat - lat);
      const dLng = toRad(sLng - lng);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat)) * Math.cos(toRad(sLat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceKm = Math.round(R * c * 100) / 100;
      const isDeliverable = distanceKm <= deliveryRadius;
      const estimatedDeliveryMins = Math.max(10, Math.round(distanceKm * 3.5) + 5);

      return {
        ...store,
        distanceKm,
        isDeliverable,
        estimatedDeliveryMins,
        deliveryRadiusKm: deliveryRadius,
      };
    });

    let result = storesWithDistance;
    if (deliverableOnly) {
      result = result.filter((s) => s.isDeliverable);
    } else if (radiusKm) {
      result = result.filter((s) => s.distanceKm <= radiusKm);
    }

    result.sort((a, b) => a.distanceKm - b.distanceKm);
    return result;
  }
}

