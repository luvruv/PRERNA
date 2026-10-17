'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import ProductCard from '@/components/ui/ProductCard';

export default function CategoryProductsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { data: category, isLoading, error } = useQuery({
    queryKey: ['category', slug],
    queryFn: () => api.get(`/categories/${slug}`),
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="h-20 bg-cream-200 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-60 bg-cream-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center bg-white rounded-3xl border border-[#F0DEC8]">
        <h2 className="text-xl font-bold text-[#6B3A0A] mb-2">Category Not Found</h2>
        <Link href="/categories" className="px-5 py-2.5 bg-[#D9700F] text-white rounded-full font-bold text-xs inline-block">
          All Categories
        </Link>
      </div>
    );
  }

  const products = category.products || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-6">
      <Link
        href="/categories"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6B3A0A] hover:text-[#D9700F]"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> All Categories
      </Link>

      <div className="bg-white rounded-3xl p-6 border border-[#F0DEC8] shadow-card flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#6B3A0A]">
            {category.name}
          </h1>
          <p className="text-xs sm:text-sm text-[#8C6D53] mt-1">
            {category.description || 'Fresh products available in this category'}
          </p>
        </div>
        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#FDF1E6] shrink-0 border border-[#F0DEC8]">
          <img
            src={category.imageUrl}
            alt={category.name}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <div>
        <div className="mb-3 text-xs text-[#8C6D53]">
          Showing {products.length} items
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#F0DEC8]">
            <p className="text-xs text-[#8C6D53]">No items currently found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {products.map((p: any) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
