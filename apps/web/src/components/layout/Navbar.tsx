'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  ShoppingBag,
  Search,
  MapPin,
  User as UserIcon,
  ChevronDown,
  LogOut,
  Store,
  Bike,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useCartStore } from '@/lib/store/useCartStore';
import { useLocationStore } from '@/lib/store/useLocationStore';
import AddressDeliveryModal from '@/components/location/AddressDeliveryModal';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout, loadProfile } = useAuthStore();
  const { cart, fetchCart } = useCartStore();
  const { address, isGpsLocated, loadStoredLocation } = useLocationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  useEffect(() => {
    loadProfile();
    loadStoredLocation();
  }, [loadProfile, loadStoredLocation]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isDashboardPage =
    pathname.startsWith('/shopkeeper') ||
    pathname.startsWith('/delivery') ||
    pathname.startsWith('/admin');

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#FAF3EB]/95 backdrop-blur-md border-b border-[#F0DEC8]">
      {/* Top micro-bar for quick demo role navigation */}
      <div className="bg-[#6B3A0A] text-[#FDF1E6] text-xs py-1 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#D9700F]">⚡ 10-Min Delivery</span>
            <span className="hidden sm:inline text-cream-200">| Serving DLF Phase 1-5, Gurugram</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-cream-300 hidden md:inline">Demo Dashboards:</span>
            <Link
              href="/shopkeeper"
              className="hover:text-primary transition-colors flex items-center gap-1 font-medium"
            >
              <Store className="w-3 h-3" /> Shopkeeper
            </Link>
            <Link
              href="/delivery"
              className="hover:text-primary transition-colors flex items-center gap-1 font-medium"
            >
              <Bike className="w-3 h-3" /> Delivery
            </Link>
            <Link
              href="/admin"
              className="hover:text-primary transition-colors flex items-center gap-1 font-medium"
            >
              <ShieldCheck className="w-3 h-3" /> Admin
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand Logo & Location */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#D9700F] flex items-center justify-center text-white font-black text-xl shadow-md shadow-orange-500/20">
              P
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-[#6B3A0A]">
                Prerna<span className="text-[#D9700F]">Store</span>
              </span>
              <div className="text-[10px] text-[#A66C3E] font-bold tracking-widest uppercase -mt-1">
                Farm to Doorstep
              </div>
            </div>
          </Link>

          {/* Delivery Location badge - Interactive & Clickable */}
          <button
            type="button"
            onClick={() => setIsAddressModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/90 hover:bg-orange-50/80 rounded-full border border-[#F0DEC8] hover:border-[#D9700F] text-xs text-[#6B3A0A] transition-all shadow-sm group active:scale-95 text-left"
            title="Click to change delivery address or track GPS"
          >
            <div className="w-6 h-6 rounded-full bg-[#FFF2E5] text-[#D9700F] flex items-center justify-center shrink-0 group-hover:bg-[#D9700F] group-hover:text-white transition-colors">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-[11px] leading-tight text-[#6B3A0A] group-hover:text-[#D9700F]">
                  Delivery in 10 Mins
                </span>
                {isGpsLocated && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="GPS Verified" />
                )}
              </div>
              <span className="text-[10px] text-[#8C6D53] truncate max-w-[110px] sm:max-w-[140px] lg:max-w-[170px]">
                {address}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-[#A66C3E] group-hover:text-[#D9700F] group-hover:translate-y-0.5 transition-all" />
          </button>
        </div>

        {/* Global Search input */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex-1 max-w-xl hidden md:flex items-center relative"
        >
          <Search className="w-4 h-4 text-[#A66C3E] absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search 'milk', 'farm apples', 'atta', 'lays chips'..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-full border border-[#F0DEC8] text-sm text-[#2D1B0D] placeholder-[#A66C3E]/70 focus:outline-none focus:border-[#D9700F] focus:ring-2 focus:ring-[#D9700F]/20 transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              type="submit"
              className="absolute right-2 px-3 py-1 bg-[#D9700F] text-white text-xs font-semibold rounded-full hover:bg-primary-hover transition-colors"
            >
              Search
            </button>
          )}
        </form>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Quick links to stores and categories */}
          <Link
            href="/stores"
            className="hidden sm:flex text-sm font-semibold text-[#6B3A0A] hover:text-[#D9700F] px-3 py-2 rounded-lg transition-colors"
          >
            Stores
          </Link>

          {/* User Account / Login */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-white rounded-full border border-[#F0DEC8] text-xs font-semibold text-[#6B3A0A] hover:border-[#D9700F] transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-[#FDF1E6] text-[#D9700F] flex items-center justify-center font-bold">
                  {user.name.charAt(0)}
                </div>
                <span className="hidden sm:inline max-w-[90px] truncate">{user.name}</span>
                <ChevronDown className="w-3 h-3 text-[#A66C3E]" />
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-[#F0DEC8] py-2 z-50 animate-in fade-in slide-in-from-top-2"
                  onMouseLeave={() => setUserDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-[#F7E3CF]/50">
                    <div className="text-xs text-[#8C6D53]">Signed in as</div>
                    <div className="font-bold text-sm text-[#6B3A0A] truncate">{user.name}</div>
                    <div className="text-[10px] font-semibold text-[#D9700F] uppercase mt-0.5">
                      Role: {user.role}
                    </div>
                  </div>

                  <Link
                    href="/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#4A321F] hover:bg-[#FDF1E6] hover:text-[#D9700F]"
                  >
                    <UserIcon className="w-4 h-4" /> My Profile & Addresses
                  </Link>

                  <Link
                    href="/orders"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#4A321F] hover:bg-[#FDF1E6] hover:text-[#D9700F]"
                  >
                    <Package className="w-4 h-4" /> My Orders & Tracking
                  </Link>

                  {user.role === 'SHOPKEEPER' && (
                    <Link
                      href="/shopkeeper"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#D9700F] hover:bg-[#FDF1E6]"
                    >
                      <Store className="w-4 h-4" /> Merchant Portal
                    </Link>
                  )}

                  {user.role === 'DELIVERY_PARTNER' && (
                    <Link
                      href="/delivery"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#D9700F] hover:bg-[#FDF1E6]"
                    >
                      <Bike className="w-4 h-4" /> Delivery Rider App
                    </Link>
                  )}

                  {user.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#D9700F] hover:bg-[#FDF1E6]"
                    >
                      <ShieldCheck className="w-4 h-4" /> Administrator Panel
                    </Link>
                  )}

                  <div className="border-t border-[#F7E3CF]/50 my-1" />

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                      router.push('/login');
                    }}
                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[#F0DEC8] text-xs font-bold text-[#6B3A0A] hover:border-[#D9700F] transition-all shadow-sm"
            >
              <UserIcon className="w-3.5 h-3.5 text-[#D9700F]" />
              <span>Login</span>
            </Link>
          )}

          {/* Cart Floating / Sticky CTA */}
          <Link
            href="/cart"
            className="flex items-center gap-2.5 px-4 py-2.5 bg-[#D9700F] text-white rounded-full font-bold text-xs sm:text-sm hover:bg-primary-hover shadow-md shadow-orange-500/25 transition-all transform active:scale-95"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4" />
              {cart.totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-white text-[#D9700F] text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                  {cart.totalItems}
                </span>
              )}
            </div>
            <span className="hidden sm:inline">
              {cart.totalItems > 0 ? `₹${cart.total}` : 'My Cart'}
            </span>
          </Link>
        </div>
      </div>

      {/* Mobile search bar visible on small devices */}
      <div className="px-4 pb-2.5 md:hidden">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 text-[#A66C3E] absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search groceries, milk, fruits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white rounded-full border border-[#F0DEC8] text-xs text-[#2D1B0D] placeholder-[#A66C3E]/70 focus:outline-none focus:border-[#D9700F]"
          />
        </form>
      </div>

      </header>

      {/* Delivery Address & GPS Modal */}
      <AddressDeliveryModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
      />
    </>
  );
}
