'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Store,
  MapPin,
  Clock,
  Star,
  CheckCircle2,
  XCircle,
  ChevronRight,
  RefreshCw,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useLocationStore } from '@/lib/store/useLocationStore';

export default function NearbyShopsSection() {
  const { latitude, longitude, address } = useLocationStore();
  const [deliverableOnly, setDeliverableOnly] = useState(true);

  const {
    data: rawData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['nearby-stores', latitude, longitude, deliverableOnly],
    queryFn: () =>
      api.get(
        `/stores/nearby?lat=${latitude}&lng=${longitude}&deliverableOnly=${deliverableOnly}`,
      ),
    enabled: typeof latitude === 'number' && typeof longitude === 'number',
  });

  const stores: any[] = Array.isArray(rawData)
    ? rawData
    : Array.isArray((rawData as any)?.stores)
      ? (rawData as any).stores
      : [];

  return (
    <section className="space-y-4">
      {/* Header and Toggle Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#D9700F] uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Live Discovery
            </span>
            {isFetching && (
              <span className="text-[10px] text-[#A66C3E] flex items-center gap-1">
                <RefreshCw className="w-2.5 h-2.5 animate-spin text-[#D9700F]" /> Calculating distance...
              </span>
            )}
          </div>
          <h2 className="text-xl md:text-2xl font-black text-[#6B3A0A] tracking-tight mt-0.5">
            Stores Near Your Location
          </h2>
          <p className="text-xs text-[#8C6D53]">
            Sorted by exact road distance from <span className="font-bold text-[#6B3A0A]">{address}</span>
          </p>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center bg-white p-1 rounded-2xl border border-[#F0DEC8] shadow-sm self-start sm:self-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setDeliverableOnly(true)}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              deliverableOnly
                ? 'bg-[#D9700F] text-white shadow-sm'
                : 'text-[#6B3A0A] hover:text-[#D9700F]'
            }`}
          >
            Delivering to Me
          </button>
          <button
            type="button"
            onClick={() => setDeliverableOnly(false)}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              !deliverableOnly
                ? 'bg-[#D9700F] text-white shadow-sm'
                : 'text-[#6B3A0A] hover:text-[#D9700F]'
            }`}
          >
            All Nearby
          </button>
        </div>
      </div>

      {/* Stores Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white rounded-3xl p-4 border border-[#F0DEC8] space-y-3">
              <div className="h-32 bg-[#FAF3EB] rounded-2xl" />
              <div className="h-4 bg-[#FAF3EB] rounded w-3/4" />
              <div className="h-3 bg-[#FAF3EB] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : stores.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-[#F0DEC8] shadow-card space-y-3">
          <div className="w-16 h-16 rounded-full bg-orange-50 text-[#D9700F] flex items-center justify-center mx-auto">
            <Store className="w-8 h-8" />
          </div>
          <h3 className="font-black text-lg text-[#6B3A0A]">No Stores Delivering Here</h3>
          <p className="text-xs text-[#8C6D53] max-w-md mx-auto">
            Currently no merchant partners deliver to this specific coordinate. You can switch to "All Nearby" to see stores in adjacent zones or change your location.
          </p>
          <button
            type="button"
            onClick={() => setDeliverableOnly(false)}
            className="px-5 py-2.5 bg-[#FAF3EB] hover:bg-orange-100 text-[#6B3A0A] border border-[#F0DEC8] rounded-full text-xs font-bold transition-all"
          >
            View All Nearby Stores Anyway
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stores.map((store: any) => {
            const isDeliverable = store.isDeliverable;

            return (
              <Link
                key={store.id}
                href={`/stores/${store.id}`}
                className="group bg-white rounded-3xl overflow-hidden border border-[#F0DEC8] hover:border-[#D9700F] transition-all shadow-card hover:shadow-soft flex flex-col justify-between"
              >
                <div>
                  {/* Banner Image */}
                  <div className="relative h-36 w-full bg-[#FDF1E6] overflow-hidden">
                    <img
                      src={
                        store.bannerUrl ||
                        'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'
                      }
                      alt={store.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Rating badge */}
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-0.5 rounded-full flex items-center gap-1 text-[11px] font-black text-[#6B3A0A] shadow-sm">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{store.rating}</span>
                    </div>

                    {/* ETA Badge */}
                    <div className="absolute bottom-3 left-3 bg-[#D9700F] text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                      <Clock className="w-3 h-3" />
                      <span>~{store.estimatedDeliveryMins || 15} Mins</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-black text-base text-[#6B3A0A] group-hover:text-[#D9700F] transition-colors">
                          {store.name}
                        </h3>
                        <p className="text-xs text-[#8C6D53] line-clamp-1 mt-0.5">
                          {store.address}, {store.city}
                        </p>
                      </div>
                    </div>

                    {/* Distance & Coverage Telemetry Pills */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2.5 py-1 bg-[#FAF3EB] text-[#6B3A0A] rounded-xl font-black border border-[#F0DEC8] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#D9700F]" />
                        <span>{store.distanceKm} km away</span>
                      </span>

                      <span className="px-2 py-1 bg-[#FAF3EB]/60 text-[#8C6D53] rounded-xl text-[11px] font-bold">
                        Radius: {store.deliveryRadiusKm || 10} km
                      </span>
                    </div>

                    {/* Delivery Availability Status Banner */}
                    <div>
                      {isDeliverable ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-[11px] font-black border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Delivers to your selected location</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 text-[11px] font-black border border-amber-200">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Outside direct delivery coverage</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="px-5 py-3 bg-[#FAF3EB]/40 border-t border-[#F7E3CF]/50 flex items-center justify-between text-xs font-bold text-[#8C6D53]">
                  <span className="flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5 text-[#D9700F]" />
                    {store._count?.products || 0} Products Listed
                  </span>
                  <span className="text-[#D9700F] flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                    Shop Store <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
