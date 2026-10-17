'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  MapPin,
  Package,
  Settings,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Store,
  Bike,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/useAuthStore';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout, loadProfile } = useAuthStore();

  React.useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse space-y-6">
        <div className="h-32 bg-[#FAF3EB] rounded-3xl" />
        <div className="h-64 bg-[#FAF3EB] rounded-3xl" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-[#F0DEC8] text-center space-y-4">
        <h2 className="text-xl font-black text-[#6B3A0A]">Sign in to View Profile</h2>
        <Link href="/login" className="px-6 py-3 bg-[#D9700F] text-white rounded-full font-bold text-xs inline-block">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-[#F0DEC8] shadow-card flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#FFF2E5] text-[#D9700F] border border-[#F0DEC8] flex items-center justify-center font-black text-2xl">
            {user.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#6B3A0A]">{user.name}</h1>
            <p className="text-xs text-[#8C6D53]">{user.email}</p>
            {user.phone && <p className="text-xs text-[#8C6D53]">{user.phone}</p>}
            <span className="inline-block mt-1 text-[10px] font-black uppercase text-[#D9700F] bg-[#FFF2E5] px-2 py-0.5 rounded-full border border-[#D9700F]/30">
              {user.role}
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            logout();
            router.push('/login');
          }}
          className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
      </div>

      {/* Navigation Options */}
      <div className="bg-white rounded-3xl border border-[#F0DEC8] shadow-card divide-y divide-[#F7E3CF]/40 overflow-hidden">
        <Link
          href="/orders"
          className="p-4 flex items-center justify-between hover:bg-[#FAF3EB]/50 transition-colors"
        >
          <div className="flex items-center gap-3 text-xs sm:text-sm font-bold text-[#6B3A0A]">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-[#D9700F] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <span>My Orders & Delivery Timeline</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#A66C3E]" />
        </Link>

        <Link
          href="/profile/addresses"
          className="p-4 flex items-center justify-between hover:bg-[#FAF3EB]/50 transition-colors"
        >
          <div className="flex items-center gap-3 text-xs sm:text-sm font-bold text-[#6B3A0A]">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <span>Saved Delivery Addresses</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#A66C3E]" />
        </Link>

        {user.role === 'SHOPKEEPER' && (
          <Link
            href="/shopkeeper"
            className="p-4 flex items-center justify-between hover:bg-[#FAF3EB]/50 transition-colors"
          >
            <div className="flex items-center gap-3 text-xs sm:text-sm font-bold text-[#6B3A0A]">
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#D9700F] flex items-center justify-center">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <span>Merchant Dashboard</span>
                <span className="block text-[10px] text-[#8C6D53] font-normal">Manage store orders, products & stock</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#A66C3E]" />
          </Link>
        )}

        {user.role === 'DELIVERY_PARTNER' && (
          <Link
            href="/delivery"
            className="p-4 flex items-center justify-between hover:bg-[#FAF3EB]/50 transition-colors"
          >
            <div className="flex items-center gap-3 text-xs sm:text-sm font-bold text-[#6B3A0A]">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <Bike className="w-4 h-4" />
              </div>
              <div>
                <span>Rider Partner App</span>
                <span className="block text-[10px] text-[#8C6D53] font-normal">Active assignments & doorstep deliveries</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#A66C3E]" />
          </Link>
        )}

        {user.role === 'ADMIN' && (
          <Link
            href="/admin"
            className="p-4 flex items-center justify-between hover:bg-[#FAF3EB]/50 transition-colors"
          >
            <div className="flex items-center gap-3 text-xs sm:text-sm font-bold text-[#6B3A0A]">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span>Platform Admin Panel</span>
                <span className="block text-[10px] text-[#8C6D53] font-normal">Platform metrics, rider dispatch & audit logs</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#A66C3E]" />
          </Link>
        )}
      </div>
    </div>
  );
}
