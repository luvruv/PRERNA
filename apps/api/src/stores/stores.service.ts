import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { datasetStore } from '../common/dataset-store';

@Injectable()
export class StoresService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    if (!this.prisma.isConnected) {
      return datasetStore.getStores();
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
      return datasetStore.getStores();
    }
  }

  async findById(id: string) {
    const store = datasetStore.getStoreById(id);
    if (!this.prisma.isConnected) {
      if (!store) {
        throw new NotFoundException('Store not found');
      }
      const storeProducts = datasetStore
        .getProducts()
        .filter((p) => p.storeId === store.id)
        .map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          price: p.price,
          mrp: p.mrp,
          unit: p.unit,
          sku: p.sku,
          isActive: p.isActive,
          images: [{ id: `img-${p.id}`, url: p.imageUrl, isPrimary: true }],
          inventory: {
            id: `inv-${p.id}`,
            availableQty: p.availableQty,
            lowStockThreshold: p.lowStockThreshold,
          },
          category: {
            id: p.categoryId,
            name: p.categoryName,
          },
        }));

      return {
        ...store,
        products: storeProducts,
      };
    }

    try {
      const dbStore = await this.prisma.store.findFirst({
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

      if (dbStore) return dbStore;
    } catch {
      // ignore
    }

    if (!store) {
      throw new NotFoundException('Store not found');
    }
    return { ...store, products: [] };
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
      stores = datasetStore.getStores();
    } else {
      try {
        stores = await this.prisma.store.findMany({
          where: { isActive: true },
        });
      } catch {
        stores = datasetStore.getStores();
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

    let result = storesWithDistance.sort((a, b) => a.distanceKm - b.distanceKm);

    if (deliverableOnly) {
      result = result.filter((s) => s.isDeliverable);
    }

    if (radiusKm !== undefined) {
      result = result.filter((s) => s.distanceKm <= radiusKm);
    }

    return { stores: result };
  }

  // Calculate Haversine distance in kilometers
  private calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
  }

  async findNearby(lat: number, lng: number, maxRadiusKm = 25) {
    const allStores = await this.prisma.store.findMany({
      where: {
        isActive: true,
        latitude: { not: null },
        longitude: { not: null },
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    const nearbyStores = allStores
      .map((store) => {
        const distanceKm = this.calculateDistanceKm(lat, lng, store.latitude!, store.longitude!);
        const deliveryRadius = store.deliveryRadiusKm ?? 10.0;
        const isDeliverable = distanceKm <= deliveryRadius;

        return {
          ...store,
          distanceKm,
          isDeliverable,
          estimatedDeliveryMins: Math.max(10, Math.round(distanceKm * 3 + 8)),
        };
      })
      .filter((store) => store.distanceKm <= maxRadiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return {
      customerLocation: { latitude: lat, longitude: lng },
      searchRadiusKm: maxRadiusKm,
      totalNearby: nearbyStores.length,
      stores: nearbyStores,
    };
  }

  // Calculate Haversine distance in kilometers
  private calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
  }

  async findNearby(lat: number, lng: number, maxRadiusKm = 25) {
    const allStores = await this.prisma.store.findMany({
      where: {
        isActive: true,
        latitude: { not: null },
        longitude: { not: null },
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    const nearbyStores = allStores
      .map((store) => {
        const distanceKm = this.calculateDistanceKm(lat, lng, store.latitude!, store.longitude!);
        const deliveryRadius = store.deliveryRadiusKm ?? 10.0;
        const isDeliverable = distanceKm <= deliveryRadius;

        return {
          ...store,
          distanceKm,
          isDeliverable,
          estimatedDeliveryMins: Math.max(10, Math.round(distanceKm * 3 + 8)),
        };
      })
      .filter((store) => store.distanceKm <= maxRadiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return {
      customerLocation: { latitude: lat, longitude: lng },
      searchRadiusKm: maxRadiusKm,
      totalNearby: nearbyStores.length,
      stores: nearbyStores,
    };
  }
}

