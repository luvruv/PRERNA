'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';

export default function CategoriesPage() {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories'),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#6B3A0A]">
          All Grocery Categories
        </h1>
        <p className="text-xs sm:text-sm text-[#8C6D53]">
          Explore fresh farm fruits, dairy, groceries, staples, snacks and beverages
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(11)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white rounded-2xl h-36 border border-[#F0DEC8]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.map((cat: any) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group bg-white rounded-2xl p-4 border border-[#F0DEC8] hover:border-[#D9700F] transition-all shadow-card hover:shadow-soft flex flex-col items-center text-center justify-between"
            >
              <div className="w-20 h-20 rounded-full overflow-hidden mb-3 bg-[#FDF1E6] p-1.5 group-hover:scale-105 transition-transform">
                <img
                  src={cat.imageUrl || 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=200&q=80'}
                  alt={cat.name}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>

              <div>
                <h3 className="font-extrabold text-xs sm:text-sm text-[#6B3A0A] group-hover:text-[#D9700F] transition-colors leading-snug">
                  {cat.name}
                </h3>
                <span className="text-[10px] text-[#A66C3E] mt-1 block">
                  {cat._count?.products || 0} products
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
