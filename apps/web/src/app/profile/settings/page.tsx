'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/useAuthStore';

export default function SettingsPage() {
  const { user, isAuthenticated, loadProfile } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await api.patch('/users/profile', { name, phone });
      await loadProfile();
      setSaved(true);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6B3A0A] hover:text-[#D9700F]"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Profile
      </Link>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#F0DEC8] shadow-card space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#6B3A0A]">Profile Settings</h1>
          <p className="text-xs text-[#8C6D53]">Update your contact information</p>
        </div>

        {saved && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
            Profile updated successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-[#6B3A0A] mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-xl text-xs sm:text-sm"
            />
          </div>

          <div>
            <label className="block font-bold text-[#6B3A0A] mb-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-2.5 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-xl text-xs sm:text-sm"
            />
          </div>

          <div>
            <label className="block font-bold text-[#6B3A0A] mb-1">Email Address</label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full p-2.5 bg-gray-50 border border-[#F0DEC8] rounded-xl text-xs text-gray-500 cursor-not-allowed"
            />
            <span className="text-[10px] text-[#8C6D53] mt-0.5 block">Email cannot be changed</span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-[#D9700F] text-white rounded-xl font-bold text-xs hover:bg-primary-hover shadow-sm flex items-center justify-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
