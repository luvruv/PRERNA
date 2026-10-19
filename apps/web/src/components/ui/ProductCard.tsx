'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Minus, Check, Clock } from 'lucide-react';
import { useCartStore } from '@/lib/store/useCartStore';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    mrp: number;
    unit: string;
    images?: { url: string }[];
    inventory?: { availableQty: number };
    store?: { name: string; slug: string };
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { cart, addItem, updateQuantity, removeItem } = useCartStore();
  const [loading, setLoading] = useState(false);

  const cartItem = cart.items.find((item) => item.productId === product.id);
  const qty = cartItem?.quantity || 0;
  const available = product.inventory?.availableQty ?? 10;
  const isOutOfStock = available <= 0;

  const imageUrl =
    product.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80';

  const discountPercent =
    product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOutOfStock || loading) return;
    setLoading(true);
    try {
      await addItem(product.id, 1, product);
    } catch (err: any) {
      console.warn('Could not add to cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleIncrement = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (loading || !cartItem) return;
    setLoading(true);
    try {
      await updateQuantity(cartItem.id, qty + 1);
    } catch (err: any) {
      alert(err.message || 'Could not update quantity');
    } finally {
      setLoading(false);
    }
  };

  const handleDecrement = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (loading || !cartItem) return;
    setLoading(true);
    try {
      if (qty === 1) {
        await removeItem(cartItem.id);
      } else {
        await updateQuantity(cartItem.id, qty - 1);
      }
    } catch (err: any) {
      alert(err.message || 'Could not update quantity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-[#F0DEC8] hover:border-[#D9700F]/40 p-3 flex flex-col justify-between shadow-card hover:shadow-soft transition-all duration-200">
      <Link href={`/products/${product.id}`} className="block relative">
        {/* Image Container with Badges */}
        <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#FDF1E6] mb-3">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {discountPercent > 0 && (
            <div className="absolute top-2 left-2 bg-[#D9700F] text-white text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-sm">
              {discountPercent}% OFF
            </div>
          )}

          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
              <span className="bg-red-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* 10-Min Timer Micro-badge */}
        <div className="flex items-center gap-1 text-[10px] font-semibold text-[#8C6D53] mb-1">
          <Clock className="w-2.5 h-2.5 text-[#D9700F]" />
          <span>10 MINS</span>
          {product.store && (
            <span className="text-[#B39378] truncate">• {product.store.name}</span>
          )}
        </div>

        {/* Product Title & Unit */}
        <h3 className="font-bold text-xs sm:text-sm text-[#2D1B0D] line-clamp-2 leading-snug group-hover:text-[#D9700F] transition-colors mb-1 min-h-[2.4rem]">
          {product.name}
        </h3>
        <p className="text-[11px] font-medium text-[#8C6D53] mb-2">{product.unit}</p>
      </Link>

      {/* Pricing & Add to Cart Action */}
      <div className="flex items-center justify-between pt-2 border-t border-[#F7E3CF]/40 mt-auto">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-black text-sm sm:text-base text-[#6B3A0A]">
              ₹{product.price}
            </span>
            {product.mrp > product.price && (
              <span className="text-[10px] sm:text-xs text-[#A66C3E] line-through">
                ₹{product.mrp}
              </span>
            )}
          </div>
        </div>

        {isOutOfStock ? (
          <button
            disabled
            className="px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50"
          >
            Out
          </button>
        ) : qty > 0 ? (
          <div className="flex items-center bg-[#D9700F] text-white rounded-xl shadow-sm overflow-hidden">
            <button
              onClick={handleDecrement}
              disabled={loading}
              className="px-2 py-1.5 hover:bg-black/10 active:scale-95 transition-all text-xs font-bold"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="px-1 text-xs font-black min-w-[18px] text-center">{qty}</span>
            <button
              onClick={handleIncrement}
              disabled={loading || qty >= available}
              className="px-2 py-1.5 hover:bg-black/10 active:scale-95 transition-all text-xs font-bold"
              aria-label="Increase quantity"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleAdd}
            disabled={loading}
            className="px-3.5 py-1.5 bg-[#FFF2E5] border border-[#D9700F] text-[#D9700F] hover:bg-[#D9700F] hover:text-white rounded-xl text-xs font-extrabold transition-all shadow-sm active:scale-95 uppercase tracking-wider"
          >
            {loading ? '...' : 'ADD'}
          </button>
        )}
      </div>
    </div>
  );
}
