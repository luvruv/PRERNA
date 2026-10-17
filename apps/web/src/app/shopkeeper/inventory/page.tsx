'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Boxes, Plus, Minus, History, AlertTriangle, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/useAuthStore';

export default function ShopkeeperInventoryPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading, loadProfile } = useAuthStore();
  const [selectedInventory, setSelectedInventory] = useState<any | null>(null);
  const [delta, setDelta] = useState<number>(10);
  const [reason, setReason] = useState<string>('Morning farm shipment arrival');
  const [movementType, setMovementType] = useState<string>('RESTOCK');
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const { data: inventoryList = [], refetch, isLoading } = useQuery({
    queryKey: ['shopkeeper-inventory'],
    queryFn: () => api.get('/shopkeeper/inventory'),
    enabled: isAuthenticated && user?.role === 'SHOPKEEPER',
  });

  if (isAuthLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse space-y-6">
        <div className="h-10 w-48 bg-[#FAF3EB] rounded-2xl" />
        <div className="h-40 bg-[#FAF3EB] rounded-3xl" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'SHOPKEEPER') {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-[#F0DEC8] text-center">
        <h2 className="text-xl font-bold text-[#6B3A0A] mb-2">Access Denied</h2>
        <Link href="/login" className="px-5 py-2.5 bg-[#D9700F] text-white rounded-full font-bold text-xs inline-block">
          Go to Login
        </Link>
      </div>
    );
  }

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInventory) return;
    setSubmitting(true);
    try {
      await api.patch(`/shopkeeper/inventory/${selectedInventory.productId}/adjust`, {
        quantityDelta: Number(delta),
        type: movementType,
        reason,
      });
      setSelectedInventory(null);
      refetch();
    } catch (err: any) {
      alert(err.message || 'Inventory adjustment failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <Link
        href="/shopkeeper"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6B3A0A] hover:text-[#D9700F]"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
      </Link>

      <div>
        <h1 className="text-2xl font-black text-[#6B3A0A]">Live Store Inventory</h1>
        <p className="text-xs text-[#8C6D53]">
          Real-time stock ledger, threshold alerts, and atomic inventory movement adjustments
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white rounded-2xl h-24 border border-[#F0DEC8]" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#F0DEC8] shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF3EB] text-[#6B3A0A] border-b border-[#F0DEC8] font-black uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Available Stock</th>
                  <th className="py-3 px-4">Reserved Stock</th>
                  <th className="py-3 px-4">Recent Movements</th>
                  <th className="py-3 px-4 text-right">Adjust Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7E3CF]/40">
                {inventoryList.map((inv: any) => {
                  const isLowStock = inv.availableQty <= inv.lowStockThreshold;
                  return (
                    <tr key={inv.id} className="hover:bg-[#FAF3EB]/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#6B3A0A]">{inv.product?.name}</div>
                        <div className="text-[10px] text-[#8C6D53]">{inv.product?.unit}</div>
                      </td>
                      <td className="py-3 px-4 text-[#8C6D53]">
                        {inv.product?.category?.name}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-black text-sm px-2.5 py-0.5 rounded-full ${
                              isLowStock
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {inv.availableQty}
                          </span>
                          {isLowStock && (
                            <span className="text-[10px] font-bold text-rose-600 flex items-center gap-0.5">
                              <AlertTriangle className="w-3 h-3" /> Low
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#8C6D53]">
                        {inv.reservedQty} units
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5 max-w-xs text-[10px] text-[#8C6D53]">
                          {inv.movements?.slice(0, 2).map((m: any) => (
                            <div key={m.id} className="truncate">
                              <span
                                className={`font-bold ${
                                  m.quantity > 0 ? 'text-emerald-700' : 'text-amber-700'
                                }`}
                              >
                                {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                              </span>{' '}
                              ({m.type}) - {m.reason || 'Movement'}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedInventory(inv);
                            setDelta(10);
                            setMovementType('RESTOCK');
                            setReason('Fresh morning delivery batch');
                          }}
                          className="px-3 py-1.5 bg-[#FFF2E5] border border-[#D9700F] text-[#D9700F] hover:bg-[#D9700F] hover:text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {selectedInventory && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#F0DEC8] shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#F7E3CF]/50 pb-3">
              <div>
                <h3 className="font-black text-base text-[#6B3A0A]">
                  Adjust Inventory
                </h3>
                <span className="text-xs text-[#8C6D53] font-semibold">
                  {selectedInventory.product?.name} (Current: {selectedInventory.availableQty})
                </span>
              </div>
              <button onClick={() => setSelectedInventory(null)} className="text-gray-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjust} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#6B3A0A] mb-1">
                  Stock Change (Delta)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    required
                    value={delta}
                    onChange={(e) => setDelta(parseInt(e.target.value, 10))}
                    className="w-full p-2.5 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-xl text-sm font-bold text-[#6B3A0A]"
                  />
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setDelta(Math.abs(delta))}
                      className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-xl font-bold"
                    >
                      + Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setDelta(-Math.abs(delta))}
                      className="px-3 py-1 bg-rose-100 text-rose-800 rounded-xl font-bold"
                    >
                      - Deduct
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-[#8C6D53] mt-1">
                  New resulting stock: {selectedInventory.availableQty + Number(delta)} units (cannot be less than 0)
                </p>
              </div>

              <div>
                <label className="block font-bold text-[#6B3A0A] mb-1">Movement Type</label>
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-xl"
                >
                  <option value="RESTOCK">RESTOCK (New supplier batch)</option>
                  <option value="ADJUSTMENT">ADJUSTMENT (Damaged/Inventory audit)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#6B3A0A] mb-1">Reason / Notes</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Delivered by Himachal farm truck"
                  className="w-full p-2.5 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-xl"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#F7E3CF]/50">
                <button
                  type="button"
                  onClick={() => setSelectedInventory(null)}
                  className="px-4 py-2 border border-[#F0DEC8] text-[#8C6D53] rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || selectedInventory.availableQty + Number(delta) < 0}
                  className="px-5 py-2 bg-[#D9700F] text-white rounded-xl font-bold shadow-sm hover:bg-primary-hover disabled:bg-gray-300"
                >
                  {submitting ? 'Updating...' : 'Commit Movement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
