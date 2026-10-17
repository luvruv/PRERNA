'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Star, MapPin, Clock, Phone, ArrowLeft, Filter } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import ProductCard from '@/components/ui/ProductCard';

export default function StoreDetailPage() {
  const params = useParams();
  const storeId = params.id as string;
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data: store, isLoading, error } = useQuery({
    queryKey: ['store', storeId],
    queryFn: () => api.get(`/stores/${storeId}`),
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="h-48 md:h-64 bg-cream-200 rounded-3xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-60 bg-cream-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center bg-white rounded-3xl border border-[#F0DEC8]">
        <h2 className="text-xl font-bold text-[#6B3A0A] mb-2">Store Not Found</h2>
        <p className="text-xs text-[#8C6D53] mb-4">The store you are looking for does not exist or has been closed.</p>
        <Link href="/stores" className="px-5 py-2.5 bg-[#D9700F] text-white rounded-full font-bold text-xs inline-block">
          Back to Stores
        </Link>
      </div>
    );
  }

  const products = store.products || [];

  // Group products by category
  const categoriesMap = new Map<string, string>();
  products.forEach((p: any) => {
    if (p.category) {
      categoriesMap.set(p.category.slug, p.category.name);
    }
  });

  const availableCategories = Array.from(categoriesMap.entries()).map(([slug, name]) => ({
    slug,
    name,
  }));

  const filteredProducts =
    selectedCategory === 'all'
      ? products
      : products.filter((p: any) => p.category?.slug === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-6">
      {/* Back button */}
      <Link
        href="/stores"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6B3A0A] hover:text-[#D9700F]"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Stores
      </Link>

      {/* Figma Store Detail Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-[#F0DEC8] bg-white shadow-card">
        <div className="h-44 md:h-64 w-full relative">
          <img
            src={store.bannerUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80'}
            alt={store.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Store Info Overlay */}
          <div className="absolute bottom-4 left-4 right-4 text-white flex flex-col md:flex-row md:items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-[#D9700F] text-white text-[11px] font-black px-2.5 py-0.5 rounded-full">
                  ⚡ 10-15 Min Delivery
                </span>
                <div className="bg-white/90 text-[#6B3A0A] px-2 py-0.5 rounded-full flex items-center gap-1 text-[11px] font-black">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{store.rating} Rating</span>
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight drop-shadow-sm">
                {store.name}
              </h1>
              <p className="text-xs sm:text-sm text-cream-100 max-w-xl mt-1 drop-shadow-sm">
                {store.description}
              </p>
            </div>

            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 text-xs text-[#6B3A0A] border border-[#F0DEC8] shrink-0">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <MapPin className="w-3.5 h-3.5 text-[#D9700F]" />
                <span>{store.address}</span>
              </div>
              {store.phone && (
                <div className="flex items-center gap-1.5 text-[11px] text-[#8C6D53]">
                  <Phone className="w-3 h-3 text-[#D9700F]" />
                  <span>{store.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
            selectedCategory === 'all'
              ? 'bg-[#D9700F] text-white shadow-md shadow-orange-500/20'
              : 'bg-white text-[#6B3A0A] border border-[#F0DEC8] hover:border-[#D9700F]'
          }`}
        >
          All Items ({products.length})
        </button>
        {availableCategories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => setSelectedCategory(cat.slug)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
              selectedCategory === cat.slug
                ? 'bg-[#D9700F] text-white shadow-md shadow-orange-500/20'
                : 'bg-white text-[#6B3A0A] border border-[#F0DEC8] hover:border-[#D9700F]'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-black text-[#6B3A0A]">
            {selectedCategory === 'all'
              ? 'Available Products'
              : categoriesMap.get(selectedCategory)}
          </h2>
          <span className="text-xs text-[#8C6D53]">
            {filteredProducts.length} items found
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-[#F0DEC8]">
            <p className="text-xs text-[#8C6D53]">No products found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {filteredProducts.map((product: any) => (
              <ProductCard
                key={product.id}
                product={{
                  ...product,
                  store: { name: store.name, slug: store.slug },
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
