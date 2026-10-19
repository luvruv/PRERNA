import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryProductsDto } from './dto/query-products.dto';
import { Prisma } from '@prisma/client';
import { datasetStore, DatasetProduct } from '../common/dataset-store';

function formatDatasetProduct(p: DatasetProduct) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
    mrp: p.mrp,
    unit: p.unit,
    sku: p.sku,
    isActive: p.isActive,
    category: {
      id: p.categoryId,
      name: p.categoryName,
      slug: p.categorySlug,
    },
    images: [{ id: `img-${p.id}`, url: p.imageUrl, isPrimary: true }],
    inventory: {
      id: `inv-${p.id}`,
      availableQty: p.availableQty,
      lowStockThreshold: p.lowStockThreshold,
    },
    store: {
      id: p.storeId,
      name: p.storeName,
      slug: p.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      rating: p.rating,
    },
    rating: p.rating,
    stockStatus: p.stockStatus,
  };
}

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryProductsDto) {
    const {
      q,
      category,
      storeId,
      minPrice,
      maxPrice,
      inStock,
      sort,
      page = 1,
      limit = 20,
    } = query;

    const skip = (page - 1) * limit;

    if (!this.prisma.isConnected) {
      let products = datasetStore.getProducts().map(formatDatasetProduct);

      if (q) {
        const lowerQ = q.toLowerCase();
        products = products.filter(
          (p) =>
            p.name.toLowerCase().includes(lowerQ) ||
            p.description.toLowerCase().includes(lowerQ) ||
            p.category.name.toLowerCase().includes(lowerQ) ||
            p.sku.toLowerCase().includes(lowerQ),
        );
      }

      if (category) {
        products = products.filter(
          (p) => p.category.slug === category || p.category.id === category,
        );
      }

      if (storeId) {
        products = products.filter((p) => p.store.id === storeId);
      }

      if (minPrice !== undefined) {
        products = products.filter((p) => p.price >= minPrice);
      }

      if (maxPrice !== undefined) {
        products = products.filter((p) => p.price <= maxPrice);
      }

      if (inStock) {
        products = products.filter((p) => p.inventory.availableQty > 0);
      }

      if (sort === 'price_asc') {
        products.sort((a, b) => a.price - b.price);
      } else if (sort === 'price_desc') {
        products.sort((a, b) => b.price - a.price);
      }

      const total = products.length;
      const items = products.slice(skip, skip + limit);

      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    }

    const where: Prisma.ProductWhereInput = {
      isActive: true,
    };

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = {
        OR: [{ slug: category }, { id: category }],
      };
    }

    if (storeId) {
      where.storeId = storeId;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    if (inStock) {
      where.inventory = {
        availableQty: { gt: 0 },
      };
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    if (sort === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (sort === 'price_desc') {
      orderBy = { price: 'desc' };
    }

    try {
      const [items, total] = await Promise.all([
        this.prisma.product.findMany({
          where,
          include: {
            images: true,
            inventory: true,
            category: true,
            store: {
              select: {
                id: true,
                name: true,
                slug: true,
                rating: true,
              },
            },
          },
          orderBy,
          skip,
          take: limit,
        }),
        this.prisma.product.count({ where }),
      ]);

      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch {
      let products = datasetStore.getProducts().map(formatDatasetProduct);
      const total = products.length;
      return {
        items: products.slice(skip, skip + limit),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    }
  }

  async findOne(id: string) {
    if (!this.prisma.isConnected) {
      const prod = datasetStore.getProductById(id);
      if (prod) {
        return formatDatasetProduct(prod);
      }
      throw new NotFoundException(`Product with ID or slug "${id}" not found`);
    }

    try {
      const product = await this.prisma.product.findFirst({
        where: {
          OR: [{ id }, { slug: id }],
          isActive: true,
        },
        include: {
          images: {
            orderBy: { sortOrder: 'asc' },
          },
          inventory: true,
          category: true,
          store: {
            select: {
              id: true,
              name: true,
              slug: true,
              rating: true,
              address: true,
              city: true,
            },
          },
        },
      });

      if (!product) {
        const prod = datasetStore.getProductById(id);
        if (prod) return formatDatasetProduct(prod);
        throw new NotFoundException(`Product with ID or slug "${id}" not found`);
      }

      return product;
    } catch {
      const prod = datasetStore.getProductById(id);
      if (prod) return formatDatasetProduct(prod);
      throw new NotFoundException(`Product with ID or slug "${id}" not found`);
    }
  }

  async findById(id: string) {
    return this.findOne(id);
  }
}

