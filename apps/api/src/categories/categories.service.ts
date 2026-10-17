import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const fallbackCategories = [
  { id: 'cat-1', name: 'Fresh Fruits', slug: 'fresh-fruits', description: 'Sweet, juicy and farm-picked fresh fruits', imageUrl: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=400&q=80', sortOrder: 1, _count: { products: 16 } },
  { id: 'cat-2', name: 'Fresh Vegetables', slug: 'fresh-vegetables', description: 'Crisp green farm-fresh veggies', imageUrl: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&w=400&q=80', sortOrder: 2, _count: { products: 20 } },
  { id: 'cat-3', name: 'Dairy, Bread & Eggs', slug: 'dairy-breakfast', description: 'Milk, butter, paneer, curd, fresh breads & farm eggs', imageUrl: 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=400&q=80', sortOrder: 3, _count: { products: 18 } },
  { id: 'cat-4', name: 'Bakery & Breads', slug: 'bakery-breads', description: 'Fresh oven breads, buns, croissants and cookies', imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80', sortOrder: 4, _count: { products: 14 } },
  { id: 'cat-5', name: 'Atta, Rice & Dal', slug: 'atta-rice-dal', description: 'Whole wheat flour, basmati rice, pulses & grains', imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80', sortOrder: 5, _count: { products: 15 } },
  { id: 'cat-6', name: 'Cooking Oils & Ghee', slug: 'cooking-oils-ghee', description: 'Refined sunflower oils, mustard oil, and pure desi ghee', imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80', sortOrder: 6, _count: { products: 12 } },
  { id: 'cat-7', name: 'Masalas & Spices', slug: 'masalas-spices', description: 'Pure ground spices, whole garam masalas & salts', imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80', sortOrder: 7, _count: { products: 16 } },
  { id: 'cat-8', name: 'Snacks & Munchies', slug: 'snacks-munchies', description: 'Chips, namkeen, roasted nuts & savory bites', imageUrl: 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=400&q=80', sortOrder: 8, _count: { products: 18 } },
  { id: 'cat-9', name: 'Cold Drinks & Juices', slug: 'cold-drinks-juices', description: 'Refreshing sodas, juices, and cold coolers', imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80', sortOrder: 9, _count: { products: 15 } },
  { id: 'cat-10', name: 'Tea, Coffee & Drinks', slug: 'tea-coffee-health', description: 'Assam tea, instant coffee, and chocolate health drinks', imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=400&q=80', sortOrder: 10, _count: { products: 14 } },
  { id: 'cat-11', name: 'Instant & Frozen Foods', slug: 'instant-foods', description: 'Noodles, pasta, ready meals & frozen peas', imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80', sortOrder: 11, _count: { products: 16 } },
  { id: 'cat-12', name: 'Biscuits & Cookies', slug: 'biscuits-cookies', description: 'Glucose biscuits, butter cookies & cream treats', imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80', sortOrder: 12, _count: { products: 14 } },
  { id: 'cat-13', name: 'Personal Care', slug: 'personal-care', description: 'Soaps, shampoos, toothpaste, lotions & grooming', imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80', sortOrder: 13, _count: { products: 14 } },
  { id: 'cat-14', name: 'Household & Cleaning', slug: 'household-cleaning', description: 'Detergent powders, floor cleaners & dishwash liquids', imageUrl: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=400&q=80', sortOrder: 14, _count: { products: 12 } },
];

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    if (!this.prisma.isConnected) {
      return fallbackCategories;
    }

    try {
      return await this.prisma.category.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: {
            select: { products: true },
          },
        },
      });
    } catch {
      return fallbackCategories;
    }
  }

  async findBySlug(slug: string) {
    if (!this.prisma.isConnected) {
      const fallback = fallbackCategories.find((c) => c.slug === slug || c.id === slug);
      if (!fallback) {
        throw new NotFoundException('Category not found');
      }
      return { ...fallback, products: [] };
    }

    try {
      const category = await this.prisma.category.findUnique({
        where: { slug },
        include: {
          products: {
            where: { isActive: true },
            include: {
              images: true,
              inventory: true,
              store: true,
            },
          },
        },
      });

      if (category) return category;
    } catch {
      // fallback
    }

    const fallback = fallbackCategories.find((c) => c.slug === slug || c.id === slug);
    if (!fallback) {
      throw new NotFoundException('Category not found');
    }

    return {
      ...fallback,
      products: [],
    };
  }
}
