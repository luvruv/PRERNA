'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Plus, Trash2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/useAuthStore';

export default function AddressesPage() {
  const { isAuthenticated, isLoading: isAuthLoading, loadProfile } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [label, setLabel] = useState('Home');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('Gurugram');
  const [state, setState] = useState('Haryana');
  const [postalCode, setPostalCode] = useState('122001');

  React.useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const { data: addresses = [], refetch, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => api.get('/users/addresses'),
    enabled: isAuthenticated,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users/addresses', {
        label,
        street,
        city,
        state,
        postalCode,
        isDefault: addresses.length === 0,
      });
      setShowModal(false);
      setStreet('');
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to add address');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this address?')) return;
    try {
      await api.delete(`/users/addresses/${id}`);
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to remove address');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await api.patch(`/users/addresses/${id}/default`);
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to update default address');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6B3A0A] hover:text-[#D9700F]"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Profile
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#6B3A0A]">Saved Delivery Addresses</h1>
          <p className="text-xs text-[#8C6D53]">Manage your doorstep delivery destinations</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-[#D9700F] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" /> Add Address
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse bg-white rounded-2xl h-24 border border-[#F0DEC8]" />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-[#F0DEC8]">
          <p className="text-xs text-[#8C6D53] mb-3">No delivery address saved yet.</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-[#D9700F] text-white rounded-xl text-xs font-bold"
          >
            Add Address Now
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr: any) => (
            <div
              key={addr.id}
              className="bg-white rounded-2xl p-4 border border-[#F0DEC8] shadow-card flex items-start justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-[#6B3A0A]">{addr.label}</span>
                  {addr.isDefault ? (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Default Delivery Address
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-[10px] text-[#D9700F] hover:underline font-bold"
                    >
                      Set as Default
                    </button>
                  )}
                </div>
                <p className="text-xs text-[#8C6D53] leading-relaxed">
                  {addr.street}, {addr.city}, {addr.state} - {addr.postalCode}
                </p>
              </div>

              <button
                onClick={() => handleDelete(addr.id)}
                className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                title="Delete address"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Address Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#F0DEC8] shadow-2xl space-y-4 animate-in fade-in">
            <h3 className="font-black text-lg text-[#6B3A0A]">Add Delivery Address</h3>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#6B3A0A] mb-1">Label</label>
                <div className="flex gap-2">
                  {['Home', 'Work', 'Other'].map((lbl) => (
                    <button
                      type="button"
                      key={lbl}
                      onClick={() => setLabel(lbl)}
                      className={`px-3 py-1.5 rounded-xl font-bold border transition-all ${
                        label === lbl
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
                <label className="block font-bold text-[#6B3A0A] mb-1">Address Details</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Flat/House number, building name, sector..."
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#6B3A0A] mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-2 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#6B3A0A] mb-1">Pincode</label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full p-2 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-[#F0DEC8] text-[#8C6D53] rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#D9700F] text-white rounded-xl font-bold shadow-sm"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
