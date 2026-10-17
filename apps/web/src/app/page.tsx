'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronRight,
  Sparkles,
  Zap,
  ShieldCheck,
  Store,
  Star,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import ProductCard from '@/components/ui/ProductCard';

export default function HomePage() {
  // 1. Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories'),
  });

  // 2. Fetch stores
  const { data: stores = [], isLoading: storesLoading } = useQuery({
    queryKey: ['stores'],
    queryFn: () => api.get('/stores'),
  });

  // 3. Fetch featured & fresh products
  const { data: popularData, isLoading: productsLoading } = useQuery({
    queryKey: ['products', 'popular'],
    queryFn: () => api.get('/products?limit=12&sort=newest'),
  });

  // 4. Fetch dairy essentials
  const { data: dairyData } = useQuery({
    queryKey: ['products', 'dairy'],
    queryFn: () => api.get('/products?category=dairy-breakfast&limit=6'),
  });

  const popularProducts = popularData?.items || [];
  const dairyProducts = dairyData?.items || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-8">
      {/* Figma Hero Banner matching the screenshot */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#F6DCC4] via-[#FCECE0] to-[#FAF3EB] border border-[#F0DEC8] shadow-soft">
        <div className="grid grid-cols-1 md:grid-cols-12 items-center min-h-[260px] md:min-h-[300px]">
          <div className="p-6 md:p-10 md:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/90 rounded-full border border-[#D9700F]/30 text-xs font-bold text-[#D9700F] shadow-sm">
              <Zap className="w-3.5 h-3.5 fill-[#D9700F]" />
              <span>SUPERFAST 10-MIN GROCERY DELIVERY</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black text-[#6B3A0A] tracking-tight leading-[1.15]">
              Fresh locals, <br />
              <span className="text-[#D9700F]">delivered fast.</span>
            </h1>

            <p className="text-sm md:text-base text-[#7C5A3E] max-w-md font-medium leading-relaxed">
              Order fresh fruits, crisp vegetables, wholesome dairy, and daily staples sourced directly from vetted neighborhood markets.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href="/search"
                className="px-6 py-3 bg-[#D9700F] text-white rounded-full font-bold text-sm hover:bg-primary-hover shadow-md shadow-orange-500/25 transition-all flex items-center gap-2 transform active:scale-95"
              >
                <span>Shop Fresh Now</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/stores"
                className="px-5 py-3 bg-white text-[#6B3A0A] border border-[#F0DEC8] rounded-full font-bold text-sm hover:border-[#D9700F] transition-all"
              >
                Browse Stores
              </Link>
            </div>
          </div>

          <div className="hidden md:block md:col-span-5 h-full relative">
            <img
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80"
              alt="Fresh fruits and groceries in basket"
              className="w-full h-full object-cover rounded-l-3xl shadow-lg"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#FAF3EB] via-transparent to-transparent pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Explore Categories - Horizontal Scroll / Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-[#6B3A0A]">Explore Categories</h2>
            <p className="text-xs text-[#8C6D53]">Handpicked farm produce and pantry staples</p>
          </div>
          <Link
            href="/categories"
            className="text-xs font-bold text-[#D9700F] hover:underline flex items-center gap-1"
          >
            <span>See all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {categoriesLoading ? (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-11 gap-3">
            {[...Array(11)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white p-2.5 rounded-2xl border border-[#F0DEC8] flex flex-col items-center">
                <div className="w-12 h-12 bg-cream-200 rounded-full mb-2" />
                <div className="h-2.5 w-10 bg-cream-200 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-2.5">
            {categories.map((cat: any) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="group bg-white rounded-2xl border border-[#F0DEC8] hover:border-[#D9700F] p-2.5 flex flex-col items-center text-center transition-all shadow-card hover:shadow-soft"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden mb-2 bg-[#FDF1E6] flex items-center justify-center p-1 group-hover:scale-110 transition-transform">
                  <img
                    src={cat.imageUrl || 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=150&q=80'}
                    alt={cat.name}
                    className="w-full h-full object-cover rounded-full"
                    loading="lazy"
                  />
                </div>
                <span className="text-[11px] font-bold text-[#4A321F] group-hover:text-[#D9700F] line-clamp-2 leading-tight">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Stores Near You (Figma screen matching) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-[#6B3A0A]">Stores Near You</h2>
            <p className="text-xs text-[#8C6D53]">Fulfilled directly by your neighborhood merchant partners</p>
          </div>
          <Link
            href="/stores"
            className="text-xs font-bold text-[#D9700F] hover:underline flex items-center gap-1"
          >
            <span>View all stores</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stores.map((store: any) => (
            <Link
              key={store.id}
              href={`/stores/${store.id}`}
              className="group bg-white rounded-2xl overflow-hidden border border-[#F0DEC8] hover:border-[#D9700F]/50 transition-all shadow-card hover:shadow-soft flex flex-col"
            >
              <div className="relative h-32 w-full bg-[#FDF1E6] overflow-hidden">
                <img
                  src={store.bannerUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'}
                  alt={store.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-1 text-[11px] font-black text-[#6B3A0A] shadow-sm">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{store.rating}</span>
                </div>
                <div className="absolute bottom-2 left-2.5 bg-[#D9700F] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                  <Clock className="w-2.5 h-2.5" />
                  <span>10-15 Mins</span>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-[#6B3A0A] group-hover:text-[#D9700F] transition-colors">
                    {store.name}
                  </h3>
                  <p className="text-xs text-[#8C6D53] line-clamp-2 mt-1">
                    {store.description}
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-[#F7E3CF]/50 flex items-center justify-between text-xs font-semibold text-[#B39378]">
                  <span>{store.address}</span>
                  <span className="text-[#D9700F] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    Enter <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular Farm-Fresh Products Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#D9700F]" />
              <h2 className="text-xl md:text-2xl font-black text-[#6B3A0A]">
                Trending Farm Fresh Picks
              </h2>
            </div>
            <p className="text-xs text-[#8C6D53]">Handpicked daily arrivals at the best wholesale rates</p>
          </div>
          <Link
            href="/search"
            className="text-xs font-bold text-[#D9700F] hover:underline flex items-center gap-1"
          >
            <span>See more</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {productsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white p-3 rounded-2xl border border-[#F0DEC8]">
                <div className="aspect-square bg-cream-200 rounded-xl mb-2" />
                <div className="h-3 w-3/4 bg-cream-200 rounded mb-1" />
                <div className="h-3 w-1/2 bg-cream-200 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {popularProducts.slice(0, 12).map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Dairy & Breakfast Banner & Shelf */}
      {dairyProducts.length > 0 && (
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-[#6B3A0A]">
                Dairy, Breads & Morning Essentials
              </h2>
              <p className="text-xs text-[#8C6D53]">Fresh milk, malai paneer, farm eggs & bakery buns</p>
            </div>
            <Link
              href="/category/dairy-breakfast"
              className="text-xs font-bold text-[#D9700F] hover:underline flex items-center gap-1"
            >
              <span>View category</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {dairyProducts.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Brand Value Props */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        <div className="bg-white p-5 rounded-2xl border border-[#F0DEC8] flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-[#FFF2E5] text-[#D9700F] flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-[#6B3A0A]">10-Minute Delivery</h4>
            <p className="text-xs text-[#8C6D53] mt-0.5">Direct fulfillment from local hyper-local stores near you.</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#F0DEC8] flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-[#FFF2E5] text-[#D9700F] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-[#6B3A0A]">Farm-Picked Quality</h4>
            <p className="text-xs text-[#8C6D53] mt-0.5">Strict quality grading, hygienic packing, sealed bags.</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#F0DEC8] flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-[#FFF2E5] text-[#D9700F] flex items-center justify-center shrink-0">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-[#6B3A0A]">Empowering Local Stores</h4>
            <p className="text-xs text-[#8C6D53] mt-0.5">Supporting local kirana owners and neighborhood merchants.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
