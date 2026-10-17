import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryProductsDto } from './dto/query-products.dto';
import { Prisma } from '@prisma/client';

const fallbackProducts = [
  {
    id: 'prod-1',
    name: 'Shimla Fresh Royal Apples',
    slug: 'shimla-fresh-royal-apples',
    description: 'Crisp, sweet, and aromatic red apples from Himachal orchards.',
    price: 180,
    mrp: 220,
    unit: '1 kg (approx 4-5 pcs)',
    sku: 'FRU-APP-001',
    isActive: true,
    category: { id: 'cat-1', name: 'Fresh Fruits', slug: 'fresh-fruits' },
    images: [{ id: 'img-1', url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80', isPrimary: true }],
    inventory: { id: 'inv-1', availableQty: 45 },
    store: { id: 'demo-store-1', name: 'Prerna Fresh Mart - DLF Phase 4', slug: 'prerna-fresh-mart-dlf-phase-4', rating: 4.8 },
  },
  {
    id: 'prod-2',
    name: 'Robusta Yellow Bananas',
    slug: 'robusta-yellow-bananas',
    description: 'Naturally ripened, potassium-rich fresh yellow bananas.',
    price: 48,
    mrp: 60,
    unit: '1 kg (approx 6 pcs)',
    sku: 'FRU-BAN-002',
    isActive: true,
    category: { id: 'cat-1', name: 'Fresh Fruits', slug: 'fresh-fruits' },
    images: [{ id: 'img-2', url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80', isPrimary: true }],
    inventory: { id: 'inv-2', availableQty: 80 },
    store: { id: 'demo-store-1', name: 'Prerna Fresh Mart - DLF Phase 4', slug: 'prerna-fresh-mart-dlf-phase-4', rating: 4.8 },
  },
  {
    id: 'prod-3',
    name: 'Amul Taaza Homogenised Toned Milk',
    slug: 'amul-taaza-toned-milk',
    description: 'Fresh toned milk, pasteurised and rich in essential calcium.',
    price: 54,
    mrp: 56,
    unit: '1 L pouch',
    sku: 'DAI-MIL-001',
    isActive: true,
    category: { id: 'cat-3', name: 'Dairy, Bread & Eggs', slug: 'dairy-breakfast' },
    images: [{ id: 'img-3', url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80', isPrimary: true }],
    inventory: { id: 'inv-3', availableQty: 100 },
    store: { id: 'demo-store-1', name: 'Prerna Fresh Mart - DLF Phase 4', slug: 'prerna-fresh-mart-dlf-phase-4', rating: 4.8 },
  },
  {
    id: 'prod-4',
    name: 'Amul Salted Butter (500g)',
    slug: 'amul-salted-butter-500g',
    description: 'Utterly butterly delicious pure dairy butter.',
    price: 275,
    mrp: 285,
    unit: '500 g pack',
    sku: 'DAI-BUT-002',
    isActive: true,
    category: { id: 'cat-3', name: 'Dairy, Bread & Eggs', slug: 'dairy-breakfast' },
    images: [{ id: 'img-4', url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80', isPrimary: true }],
    inventory: { id: 'inv-4', availableQty: 35 },
    store: { id: 'demo-store-1', name: 'Prerna Fresh Mart - DLF Phase 4', slug: 'prerna-fresh-mart-dlf-phase-4', rating: 4.8 },
  },
  {
    id: 'prod-5',
    name: 'Nasik Red Onions (Pyaaz)',
    slug: 'nasik-red-onions',
    description: 'Pungent, dry, and quality cooking onions for daily curries.',
    price: 38,
    mrp: 50,
    unit: '1 kg',
    sku: 'VEG-ONI-001',
    isActive: true,
    category: { id: 'cat-2', name: 'Fresh Vegetables', slug: 'fresh-vegetables' },
    images: [{ id: 'img-5', url: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80', isPrimary: true }],
    inventory: { id: 'inv-5', availableQty: 120 },
    store: { id: 'demo-store-1', name: 'Prerna Fresh Mart - DLF Phase 4', slug: 'prerna-fresh-mart-dlf-phase-4', rating: 4.8 },
  },
  {
    id: 'prod-6',
    name: 'Fresh Hybrid Red Tomatoes (Tamatar)',
    slug: 'fresh-hybrid-red-tomatoes',
    description: 'Plump, firm, and juicy red salad and cooking tomatoes.',
    price: 32,
    mrp: 45,
    unit: '1 kg',
    sku: 'VEG-TOM-002',
    isActive: true,
    category: { id: 'cat-2', name: 'Fresh Vegetables', slug: 'fresh-vegetables' },
    images: [{ id: 'img-6', url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80', isPrimary: true }],
    inventory: { id: 'inv-6', availableQty: 90 },
    store: { id: 'demo-store-1', name: 'Prerna Fresh Mart - DLF Phase 4', slug: 'prerna-fresh-mart-dlf-phase-4', rating: 4.8 },
  },
  {
    id: 'prod-7',
    name: 'Aashirvaad Shudh Chakki Atta (10kg)',
    slug: 'aashirvaad-shudh-chakki-atta-10kg',
    description: '100% whole wheat grain flour for soft and fluffy rotis.',
    price: 435,
    mrp: 480,
    unit: '10 kg bag',
    sku: 'STA-ATT-001',
    isActive: true,
    category: { id: 'cat-5', name: 'Atta, Rice & Dal', slug: 'atta-rice-dal' },
    images: [{ id: 'img-7', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80', isPrimary: true }],
    inventory: { id: 'inv-7', availableQty: 50 },
    store: { id: 'demo-store-1', name: 'Prerna Fresh Mart - DLF Phase 4', slug: 'prerna-fresh-mart-dlf-phase-4', rating: 4.8 },
  },
  {
    id: 'prod-8',
    name: "Lay's India's Magic Masala Chips",
    slug: 'lays-indias-magic-masala-chips',
    description: 'Crispy ridged potato chips seasoned with Indian spices.',
    price: 20,
    mrp: 20,
    unit: '50 g pouch',
    sku: 'SNK-LAY-001',
    isActive: true,
    category: { id: 'cat-8', name: 'Snacks & Munchies', slug: 'snacks-munchies' },
    images: [{ id: 'img-8', url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80', isPrimary: true }],
    inventory: { id: 'inv-8', availableQty: 150 },
    store: { id: 'demo-store-1', name: 'Prerna Fresh Mart - DLF Phase 4', slug: 'prerna-fresh-mart-dlf-phase-4', rating: 4.8 },
  },
];

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
    } else if (sort === 'newest') {
      orderBy = { createdAt: 'desc' };
    }

    const skip = (page - 1) * limit;

    if (!this.prisma.isConnected) {
      let filtered = [...fallbackProducts];
      if (q) {
        const lowerQ = q.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(lowerQ) ||
            p.description.toLowerCase().includes(lowerQ),
        );
      }
      if (category) {
        filtered = filtered.filter(
          (p) => p.category.slug === category || p.category.id === category,
        );
      }
      const total = filtered.length;
      const items = filtered.slice(skip, skip + limit);

      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
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
      let filtered = [...fallbackProducts];
      if (q) {
        const lowerQ = q.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(lowerQ) ||
            p.description.toLowerCase().includes(lowerQ),
        );
      }
      if (category) {
        filtered = filtered.filter(
          (p) => p.category.slug === category || p.category.id === category,
        );
      }
      const total = filtered.length;
      const items = filtered.slice(skip, skip + limit);

      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    }
  }

  async findById(id: string) {
    if (!this.prisma.isConnected) {
      const fallback = fallbackProducts.find((p) => p.id === id || p.slug === id);
      if (!fallback) {
        throw new NotFoundException('Product not found');
      }
      return fallback;
    }

    try {
      const product = await this.prisma.product.findFirst({
        where: {
          OR: [{ id }, { slug: id }],
        },
        include: {
          images: true,
          inventory: true,
          category: true,
          store: true,
        },
      });

      if (product) return product;
    } catch {
      // offline fallback
    }

    const fallback = fallbackProducts.find((p) => p.id === id || p.slug === id);
    if (!fallback) {
      throw new NotFoundException('Product not found');
    }

    return fallback;
  }
}
