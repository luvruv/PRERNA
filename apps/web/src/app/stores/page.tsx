'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Store, Star, MapPin, Clock, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';

export default function StoresPage() {
  const { data: stores = [], isLoading } = useQuery({
    queryKey: ['stores'],
    queryFn: () => api.get('/stores'),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-[#6B3A0A]">
          Partner Grocery Stores
        </h1>
        <p className="text-xs sm:text-sm text-[#8C6D53]">
          Browse verified hyper-local grocery stores delivering in 10 minutes
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white rounded-3xl h-64 border border-[#F0DEC8]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stores.map((store: any) => (
            <Link
              key={store.id}
              href={`/stores/${store.id}`}
              className="group bg-white rounded-3xl overflow-hidden border border-[#F0DEC8] hover:border-[#D9700F]/60 transition-all shadow-card hover:shadow-soft flex flex-col"
            >
              <div className="relative h-44 w-full bg-[#FDF1E6] overflow-hidden">
                <img
                  src={store.bannerUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'}
                  alt={store.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1 text-xs font-black text-[#6B3A0A] shadow-sm">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{store.rating}</span>
                </div>
                <div className="absolute bottom-3 left-3 bg-[#D9700F] text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                  <Clock className="w-3 h-3" />
                  <span>10-15 Mins</span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-black text-lg text-[#6B3A0A] group-hover:text-[#D9700F] transition-colors">
                    {store.name}
                  </h3>
                  <p className="text-xs text-[#8C6D53] line-clamp-2 mt-1.5 leading-relaxed">
                    {store.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#F7E3CF]/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-[#8C6D53] max-w-[200px] truncate">
                    <MapPin className="w-3.5 h-3.5 text-[#D9700F] shrink-0" />
                    <span>{store.address}</span>
                  </div>
                  <span className="font-bold text-[#D9700F] flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                    Shop Store <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
