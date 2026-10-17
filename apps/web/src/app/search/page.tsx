'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, Check } from 'lucide-react';
import { api } from '@/lib/api';
import ProductCard from '@/components/ui/ProductCard';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [q, setQ] = useState(initialQuery);
  const [debouncedQ, setDebouncedQ] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sort, setSort] = useState<string>('newest');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(q);
      const url = new URL(window.location.href);
      if (q) url.searchParams.set('q', q);
      else url.searchParams.delete('q');
      window.history.replaceState({}, '', url.toString());
    }, 350);
    return () => clearTimeout(timer);
  }, [q]);

  // Fetch categories & stores for filter dropdowns
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories'),
  });

  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: () => api.get('/stores'),
  });

  // Fetch products matching filters
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', debouncedQ, selectedCategory, selectedStore, inStockOnly, sort],
    queryFn: () => {
      const params = new URLSearchParams();
      if (debouncedQ) params.append('q', debouncedQ);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedStore) params.append('storeId', selectedStore);
      if (inStockOnly) params.append('inStock', 'true');
      if (sort) params.append('sort', sort);
      return api.get(`/products?${params.toString()}`);
    },
  });

  const items = productsData?.items || [];
  const total = productsData?.total || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Search Header Input */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-[#F0DEC8] shadow-card space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 text-[#A66C3E] absolute left-4 top-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search groceries (e.g. 'milk', 'apple', 'atta', 'lays', 'dove')..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-2xl text-sm sm:text-base text-[#2D1B0D] placeholder-[#A66C3E]/70 focus:outline-none focus:border-[#D9700F] focus:ring-2 focus:ring-[#D9700F]/20"
          />
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
          <div className="flex items-center gap-1 font-bold text-[#6B3A0A] mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 bg-white border border-[#F0DEC8] rounded-xl text-xs font-semibold text-[#6B3A0A] focus:outline-none focus:border-[#D9700F]"
          >
            <option value="">All Categories</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Store Filter */}
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="px-3 py-1.5 bg-white border border-[#F0DEC8] rounded-xl text-xs font-semibold text-[#6B3A0A] focus:outline-none focus:border-[#D9700F]"
          >
            <option value="">All Stores</option>
            {stores.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-1.5 bg-white border border-[#F0DEC8] rounded-xl text-xs font-semibold text-[#6B3A0A] focus:outline-none focus:border-[#D9700F]"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>

          {/* In Stock Toggle */}
          <button
            type="button"
            onClick={() => setInStockOnly(!inStockOnly)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 ${
              inStockOnly
                ? 'bg-[#D9700F] text-white border-[#D9700F]'
                : 'bg-white text-[#6B3A0A] border-[#F0DEC8] hover:border-[#D9700F]'
            }`}
          >
            {inStockOnly && <Check className="w-3 h-3" />}
            <span>In-Stock Only</span>
          </button>

          {(selectedCategory || selectedStore || inStockOnly || q) && (
            <button
              onClick={() => {
                setQ('');
                setSelectedCategory('');
                setSelectedStore('');
                setInStockOnly(false);
                setSort('newest');
              }}
              className="text-[#D9700F] hover:underline font-bold text-xs ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Results Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-[#6B3A0A]">
            {debouncedQ ? `Results for "${debouncedQ}"` : 'All Products'}
          </h2>
          <span className="text-xs font-semibold text-[#8C6D53]">
            {total} items found
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white p-3 rounded-2xl border border-[#F0DEC8] h-60" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#F0DEC8] shadow-card space-y-3">
            <div className="w-16 h-16 rounded-full bg-[#FFF2E5] text-[#D9700F] flex items-center justify-center mx-auto">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="font-black text-lg text-[#6B3A0A]">No Products Found</h3>
            <p className="text-xs text-[#8C6D53] max-w-sm mx-auto">
              We couldn't find any products matching your filters. Try checking your spelling or clearing filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {items.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse space-y-4">
          <div className="h-14 bg-cream-200 rounded-3xl" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
