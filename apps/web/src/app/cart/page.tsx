'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Clock,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { useCartStore } from '@/lib/store/useCartStore';
import { useAuthStore } from '@/lib/store/useAuthStore';

export default function CartPage() {
  const router = useRouter();
  const { cart, fetchCart, updateQuantity, removeItem, clearCart, isLoading } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-[#F0DEC8] text-center shadow-card space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#FFF2E5] text-[#D9700F] flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-[#6B3A0A]">Sign in to View Your Cart</h2>
        <p className="text-xs text-[#8C6D53]">
          Please sign in to access your saved items, addresses and place orders.
        </p>
        <Link
          href="/login"
          className="inline-block px-6 py-3 bg-[#D9700F] text-white rounded-full font-bold text-xs shadow-md shadow-orange-500/20"
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-[#F0DEC8] text-center shadow-card space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#FFF2E5] text-[#D9700F] flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-[#6B3A0A]">Your Cart is Empty</h2>
        <p className="text-xs text-[#8C6D53]">
          Looks like you haven't added anything to your cart yet. Explore fresh fruits, dairy and groceries now!
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-[#D9700F] text-white rounded-full font-bold text-xs shadow-md shadow-orange-500/20"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#6B3A0A]">
            Shopping Cart
          </h1>
          <p className="text-xs text-[#8C6D53]">
            {cart.totalItems} {cart.totalItems === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        <button
          onClick={() => clearCart()}
          className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 hover:underline"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-7 space-y-3">
          {/* 10-Min Superfast Delivery Alert */}
          <div className="p-3.5 bg-gradient-to-r from-[#FFF2E5] to-[#FAF3EB] rounded-2xl border border-[#D9700F]/30 flex items-center gap-3">
            <Clock className="w-5 h-5 text-[#D9700F] shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-[#6B3A0A]">Instant Delivery in 10-15 Minutes</span>
              <p className="text-[11px] text-[#8C6D53]">Items are packed fresh from local partner shelves.</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-[#F0DEC8] shadow-card divide-y divide-[#F7E3CF]/40">
            {cart.items.map((item) => (
              <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4">
                {/* Thumbnail */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-[#FDF1E6] shrink-0 border border-[#F0DEC8]">
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80'}
                    alt={item.productName}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-xs sm:text-sm text-[#2D1B0D] truncate">
                    {item.productName}
                  </h3>
                  <div className="text-[11px] text-[#8C6D53] mt-0.5">{item.unit}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-black text-sm text-[#6B3A0A]">
                      ₹{item.price}
                    </span>
                    {item.mrp > item.price && (
                      <span className="text-[10px] text-[#A66C3E] line-through">
                        ₹{item.mrp}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center bg-[#D9700F] text-white rounded-xl shadow-sm overflow-hidden">
                    <button
                      onClick={() => {
                        if (item.quantity === 1) removeItem(item.id);
                        else updateQuantity(item.id, item.quantity - 1);
                      }}
                      className="px-2.5 py-1.5 hover:bg-black/10 text-xs font-bold"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2 text-xs font-black min-w-[20px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-2.5 py-1.5 hover:bg-black/10 text-xs font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="font-bold text-xs text-[#6B3A0A]">
                    ₹{item.subtotal}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bill Summary & Proceed to Checkout */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-[#F0DEC8] shadow-card space-y-4">
            <h3 className="font-black text-base text-[#6B3A0A] border-b border-[#F7E3CF]/50 pb-3">
              Bill Summary
            </h3>

            <div className="space-y-2.5 text-xs text-[#6B3A0A]">
              <div className="flex justify-between">
                <span>Item Subtotal</span>
                <span className="font-bold">₹{cart.subtotal}</span>
              </div>
              <div className="flex justify-between text-[#8C6D53]">
                <span>Delivery Charge</span>
                <span className="font-bold text-[#D9700F]">₹{cart.deliveryFee}</span>
              </div>
              <div className="flex justify-between text-[#8C6D53]">
                <span>Handling & Taxes (5%)</span>
                <span>₹{cart.tax}</span>
              </div>
              <div className="border-t border-[#F7E3CF] pt-3 flex justify-between text-base font-black text-[#6B3A0A]">
                <span>Grand Total</span>
                <span className="text-xl text-[#D9700F]">₹{cart.total}</span>
              </div>
            </div>

            <button
              onClick={() => router.push('/checkout')}
              className="w-full py-4 bg-[#D9700F] text-white rounded-2xl font-black text-sm hover:bg-primary-hover shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-2 transform active:scale-95"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Cancellation / Return policy */}
          <div className="p-4 bg-white/70 rounded-2xl border border-[#F0DEC8] text-[11px] text-[#8C6D53] space-y-1">
            <div className="font-bold text-[#6B3A0A] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Safe & Sealed Delivery Guaranteed</span>
            </div>
            <p>
              Cancellation is permitted anytime while your order is in PENDING or CONFIRMED state.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
