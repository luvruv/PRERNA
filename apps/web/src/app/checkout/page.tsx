'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin,
  Plus,
  CreditCard,
  Banknote,
  ShieldCheck,
  ArrowRight,
  Clock,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useCartStore } from '@/lib/store/useCartStore';
import { useAuthStore } from '@/lib/store/useAuthStore';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, fetchCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();

  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'TEST_PAYMENT'>('COD');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Address modal state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newLabel, setNewLabel] = useState('Home');
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('Gurugram');
  const [newState, setNewState] = useState('Haryana');
  const [newPostalCode, setNewPostalCode] = useState('122001');

  // Fetch saved user addresses
  const { data: addresses = [], refetch: refetchAddresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => api.get('/users/addresses'),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find((a: any) => a.isDefault) || addresses[0];
      setSelectedAddressId(defaultAddr.id);
    }
  }, [addresses, selectedAddressId]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-[#F0DEC8] text-center space-y-4">
        <h2 className="text-xl font-black text-[#6B3A0A]">Please Sign In</h2>
        <p className="text-xs text-[#8C6D53]">You must be logged in to proceed to checkout.</p>
        <Link href="/login" className="px-6 py-3 bg-[#D9700F] text-white rounded-full font-bold text-xs inline-block">
          Go to Login
        </Link>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-[#F0DEC8] text-center space-y-4">
        <h2 className="text-xl font-black text-[#6B3A0A]">Your Cart is Empty</h2>
        <Link href="/" className="px-6 py-3 bg-[#D9700F] text-white rounded-full font-bold text-xs inline-block">
          Explore Groceries
        </Link>
      </div>
    );
  }

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.post('/users/addresses', {
        label: newLabel,
        street: newStreet,
        city: newCity,
        state: newState,
        postalCode: newPostalCode,
        isDefault: true,
      });
      await refetchAddresses();
      setSelectedAddressId(created.id);
      setShowAddressModal(false);
      setNewStreet('');
    } catch (err: any) {
      alert(err.message || 'Failed to save address');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setErrorMsg('Please select or add a delivery address');
      return;
    }

    setIsPlacingOrder(true);
    setErrorMsg(null);

    try {
      const order = await api.post('/orders/checkout', {
        addressId: selectedAddressId,
        paymentMethod,
        specialInstructions: specialInstructions || undefined,
      });

      // Clear local cart store and redirect to live tracking page
      await fetchCart();
      router.push(`/orders/${order.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Checkout failed. Please try again.');
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <Link
        href="/cart"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6B3A0A] hover:text-[#D9700F]"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Cart
      </Link>

      <h1 className="text-2xl sm:text-3xl font-black text-[#6B3A0A]">
        Checkout & Payment
      </h1>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-700">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Address, Payment, Instructions */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Delivery Address Card */}
          <div className="bg-white rounded-3xl p-6 border border-[#F0DEC8] shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-[#F7E3CF]/50 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#FFF2E5] text-[#D9700F] flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h2 className="font-black text-base text-[#6B3A0A]">
                  Delivery Address
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAddressModal(true)}
                className="text-xs font-bold text-[#D9700F] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Address
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="text-center py-6 space-y-2">
                <p className="text-xs text-[#8C6D53]">No delivery address saved yet.</p>
                <button
                  onClick={() => setShowAddressModal(true)}
                  className="px-4 py-2 bg-[#D9700F] text-white text-xs font-bold rounded-xl"
                >
                  Add Address
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {addresses.map((addr: any) => {
                  const isSelected = selectedAddressId === addr.id;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'border-[#D9700F] bg-[#FFF2E5]/50 ring-1 ring-[#D9700F]'
                          : 'border-[#F0DEC8] hover:border-[#D9700F]/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="delivery_address"
                        checked={isSelected}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="mt-1 text-[#D9700F] focus:ring-[#D9700F]"
                      />
                      <div className="text-xs flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-[#6B3A0A]">{addr.label}</span>
                          {addr.isDefault && (
                            <span className="text-[10px] bg-amber-100 text-[#D9700F] font-bold px-1.5 py-0.2 rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-[#8C6D53] mt-0.5 leading-relaxed">
                          {addr.street}, {addr.city}, {addr.state} - {addr.postalCode}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Payment Method Card */}
          <div className="bg-white rounded-3xl p-6 border border-[#F0DEC8] shadow-card space-y-4">
            <div className="flex items-center gap-2 border-b border-[#F7E3CF]/50 pb-3">
              <div className="w-8 h-8 rounded-full bg-[#FFF2E5] text-[#D9700F] flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h2 className="font-black text-base text-[#6B3A0A]">
                Payment Method
              </h2>
            </div>

            <div className="space-y-3">
              {/* COD Option */}
              <label
                onClick={() => setPaymentMethod('COD')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3.5 ${
                  paymentMethod === 'COD'
                    ? 'border-[#D9700F] bg-[#FFF2E5]/60 ring-1 ring-[#D9700F]'
                    : 'border-[#F0DEC8] hover:border-[#D9700F]/40'
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="text-[#D9700F] focus:ring-[#D9700F]"
                />
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-[#D9700F] flex items-center justify-center shrink-0">
                  <Banknote className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <span className="font-black text-[#6B3A0A] block text-sm">
                    Cash on Delivery (COD)
                  </span>
                  <span className="text-[#8C6D53]">
                    Pay in cash directly to rider upon delivery at your doorstep
                  </span>
                </div>
              </label>

              {/* Test Online Payment Option */}
              <label
                onClick={() => setPaymentMethod('TEST_PAYMENT')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3.5 ${
                  paymentMethod === 'TEST_PAYMENT'
                    ? 'border-[#D9700F] bg-[#FFF2E5]/60 ring-1 ring-[#D9700F]'
                    : 'border-[#F0DEC8] hover:border-[#D9700F]/40'
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  checked={paymentMethod === 'TEST_PAYMENT'}
                  onChange={() => setPaymentMethod('TEST_PAYMENT')}
                  className="text-[#D9700F] focus:ring-[#D9700F]"
                />
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <span className="font-black text-[#6B3A0A] block text-sm">
                    Test Online Payment (Instant Sim)
                  </span>
                  <span className="text-[#8C6D53]">
                    Simulates online gateway approval without real card charges
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* 3. Delivery Instructions Note */}
          <div className="bg-white rounded-3xl p-5 border border-[#F0DEC8] shadow-card">
            <label className="block text-xs font-bold text-[#6B3A0A] mb-1.5">
              Special Delivery Instructions (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Please ring doorbell twice, leave with security guard..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-xl text-xs sm:text-sm text-[#2D1B0D] placeholder-[#A66C3E]/60 focus:outline-none focus:border-[#D9700F]"
            />
          </div>
        </div>

        {/* Right Column: Order Review & Place Order Button */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-[#F0DEC8] shadow-card space-y-4">
            <h3 className="font-black text-base text-[#6B3A0A] border-b border-[#F7E3CF]/50 pb-3">
              Order Summary ({cart.totalItems} items)
            </h3>

            {/* Micro items list */}
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {cart.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs">
                  <div className="truncate max-w-[190px]">
                    <span className="font-bold text-[#6B3A0A]">{item.quantity}x</span>{' '}
                    <span className="text-[#2D1B0D]">{item.productName}</span>
                  </div>
                  <span className="font-bold text-[#6B3A0A]">₹{item.subtotal}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-[#F7E3CF] pt-3 space-y-2 text-xs text-[#6B3A0A]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold">₹{cart.subtotal}</span>
              </div>
              <div className="flex justify-between text-[#8C6D53]">
                <span>Delivery Charge</span>
                <span className="font-bold text-[#D9700F]">₹{cart.deliveryFee}</span>
              </div>
              <div className="flex justify-between text-[#8C6D53]">
                <span>Taxes & Handling (5%)</span>
                <span>₹{cart.tax}</span>
              </div>
              <div className="border-t border-[#F7E3CF] pt-3 flex justify-between text-base font-black text-[#6B3A0A]">
                <span>To Pay</span>
                <span className="text-xl text-[#D9700F]">₹{cart.total}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder || !selectedAddressId}
              className="w-full py-4 bg-[#D9700F] text-white rounded-2xl font-black text-sm hover:bg-primary-hover shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-2 transform active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <span>
                {isPlacingOrder
                  ? 'Processing Order...'
                  : paymentMethod === 'COD'
                  ? `Place COD Order • ₹${cart.total}`
                  : `Pay & Place Order • ₹${cart.total}`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#F0DEC8] shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="font-black text-lg text-[#6B3A0A]">Add New Address</h3>

            <form onSubmit={handleAddAddress} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#6B3A0A] mb-1">Address Label</label>
                <div className="flex gap-2">
                  {['Home', 'Work', 'Other'].map((lbl) => (
                    <button
                      type="button"
                      key={lbl}
                      onClick={() => setNewLabel(lbl)}
                      className={`px-3 py-1.5 rounded-xl font-bold border transition-all ${
                        newLabel === lbl
                          ? 'bg-[#D9700F] text-white border-[#D9700F]'
                          : 'bg-white text-[#6B3A0A] border-[#F0DEC8]'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#6B3A0A] mb-1">House / Flat / Street</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Flat 301, Tower B, Sunshine Apartments, Sector 14"
                  value={newStreet}
                  onChange={(e) => setNewStreet(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-xl text-xs focus:outline-none focus:border-[#D9700F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#6B3A0A] mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full p-2 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#6B3A0A] mb-1">Pincode</label>
                  <input
                    type="text"
                    required
                    value={newPostalCode}
                    onChange={(e) => setNewPostalCode(e.target.value)}
                    className="w-full p-2 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="px-4 py-2 border border-[#F0DEC8] text-[#8C6D53] rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#D9700F] text-white rounded-xl font-bold shadow-sm"
                >
                  Save & Use Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
