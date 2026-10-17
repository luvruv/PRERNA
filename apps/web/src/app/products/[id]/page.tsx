'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  ShieldCheck,
  Plus,
  Minus,
  ShoppingBag,
  Store,
  Check,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useCartStore } from '@/lib/store/useCartStore';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const { cart, addItem, updateQuantity, removeItem } = useCartStore();
  const [loadingAction, setLoadingAction] = useState(false);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => api.get(`/products/${productId}`),
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-square bg-cream-200 rounded-3xl" />
          <div className="space-y-4">
            <div className="h-8 bg-cream-200 rounded w-3/4" />
            <div className="h-4 bg-cream-200 rounded w-1/2" />
            <div className="h-12 bg-cream-200 rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center bg-white rounded-3xl border border-[#F0DEC8]">
        <h2 className="text-xl font-bold text-[#6B3A0A] mb-2">Product Not Found</h2>
        <Link href="/" className="px-5 py-2.5 bg-[#D9700F] text-white rounded-full font-bold text-xs inline-block">
          Return to Home
        </Link>
      </div>
    );
  }

  const cartItem = cart.items.find((item) => item.productId === product.id);
  const qty = cartItem?.quantity || 0;
  const available = product.inventory?.availableQty ?? 10;
  const isOutOfStock = available <= 0;

  const imageUrl =
    product.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';

  const discountPercent =
    product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  const handleAdd = async () => {
    if (isOutOfStock || loadingAction) return;
    setLoadingAction(true);
    try {
      await addItem(product.id, 1);
    } catch (err: any) {
      alert(err.message || 'Could not add to cart');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleIncrement = async () => {
    if (loadingAction || !cartItem) return;
    setLoadingAction(true);
    try {
      await updateQuantity(cartItem.id, qty + 1);
    } catch (err: any) {
      alert(err.message || 'Could not update quantity');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDecrement = async () => {
    if (loadingAction || !cartItem) return;
    setLoadingAction(true);
    try {
      if (qty === 1) {
        await removeItem(cartItem.id);
      } else {
        await updateQuantity(cartItem.id, qty - 1);
      }
    } catch (err: any) {
      alert(err.message || 'Could not update quantity');
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6B3A0A] hover:text-[#D9700F]"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </Link>

      <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#F0DEC8] shadow-card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Product Image */}
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#FDF1E6] border border-[#F0DEC8]">
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
            {discountPercent > 0 && (
              <span className="absolute top-4 left-4 bg-[#D9700F] text-white text-xs font-black px-2.5 py-1 rounded-lg shadow-sm">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Product Details & Actions */}
          <div className="space-y-5">
            {/* Store & Category tags */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              {product.store && (
                <Link
                  href={`/stores/${product.store.id}`}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-[#FFF2E5] text-[#D9700F] font-bold rounded-full border border-[#D9700F]/30 hover:bg-[#D9700F] hover:text-white transition-all"
                >
                  <Store className="w-3 h-3" />
                  <span>{product.store.name}</span>
                </Link>
              )}
              {product.category && (
                <span className="px-3 py-1 bg-gray-100 text-gray-700 font-medium rounded-full">
                  {product.category.name}
                </span>
              )}
            </div>

            {/* Title & Unit */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#6B3A0A] tracking-tight">
                {product.name}
              </h1>
              <p className="text-sm font-semibold text-[#8C6D53] mt-1">
                Net Quantity: {product.unit}
              </p>
            </div>

            {/* Pricing Section */}
            <div className="bg-[#FAF3EB] p-4 rounded-2xl border border-[#F0DEC8] flex items-baseline gap-3">
              <span className="text-3xl font-black text-[#6B3A0A]">
                ₹{product.price}
              </span>
              {product.mrp > product.price && (
                <>
                  <span className="text-sm text-[#A66C3E] line-through">
                    MRP ₹{product.mrp}
                  </span>
                  <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Save ₹{product.mrp - product.price}
                  </span>
                </>
              )}
              <span className="text-[10px] text-[#8C6D53] block ml-auto">
                (Inclusive of all taxes)
              </span>
            </div>

            {/* In-Stock & 10 Min Guarantee */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 font-semibold">
                <Clock className="w-4 h-4 text-[#D9700F]" />
                <span className="text-[#6B3A0A]">Superfast Delivery in 10-15 Minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-bold">
                  {available > 0 ? `In Stock (${available} units available)` : 'Currently Out of Stock'}
                </span>
              </div>
            </div>

            {/* Add to Cart / Quantity controls */}
            <div className="pt-2">
              {isOutOfStock ? (
                <button
                  disabled
                  className="w-full py-3.5 rounded-2xl bg-gray-100 text-gray-400 font-bold text-sm cursor-not-allowed border border-gray-200"
                >
                  Product Out of Stock
                </button>
              ) : qty > 0 ? (
                <div className="flex items-center justify-between p-2 bg-[#FAF3EB] rounded-2xl border border-[#D9700F]/40">
                  <span className="text-xs font-bold text-[#6B3A0A] ml-2">Quantity in cart:</span>
                  <div className="flex items-center bg-[#D9700F] text-white rounded-xl shadow-sm">
                    <button
                      onClick={handleDecrement}
                      disabled={loadingAction}
                      className="px-3.5 py-2 hover:bg-black/10 active:scale-95 font-bold"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-3 text-sm font-black min-w-[28px] text-center">{qty}</span>
                    <button
                      onClick={handleIncrement}
                      disabled={loadingAction || qty >= available}
                      className="px-3.5 py-2 hover:bg-black/10 active:scale-95 font-bold"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleAdd}
                  disabled={loadingAction}
                  className="w-full py-4 bg-[#D9700F] text-white rounded-2xl font-bold text-sm hover:bg-primary-hover transition-all shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 transform active:scale-95"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{loadingAction ? 'Adding...' : 'Add to Cart'}</span>
                </button>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="pt-4 border-t border-[#F7E3CF]/50 space-y-1.5">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#6B3A0A]">
                  Product Description
                </h3>
                <p className="text-xs sm:text-sm text-[#7C5A3E] leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
