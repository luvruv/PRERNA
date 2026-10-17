'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, UserCheck, Store, Bike, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/lib/store/useAuthStore';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      const user = await login(email, password);
      redirectByRole(user.role);
    } catch (err: any) {
      setFormError(err.message || 'Login failed');
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoRole: string, demoPass = '2026@prerna') => {
    setFormError(null);
    setEmail(demoEmail);
    setPassword(demoPass);
    try {
      const user = await login(demoEmail, demoPass);
      redirectByRole(user.role);
    } catch (err: any) {
      setFormError(err.message || 'Demo login failed');
    }
  };

  const redirectByRole = (role: string) => {
    if (role === 'SHOPKEEPER') {
      window.location.href = '/shopkeeper';
    } else if (role === 'DELIVERY_PARTNER') {
      window.location.href = '/delivery';
    } else if (role === 'ADMIN') {
      window.location.href = '/admin';
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Card Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#D9700F] text-white flex items-center justify-center font-black text-2xl mx-auto shadow-md shadow-orange-500/20">
            P
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#6B3A0A] tracking-tight">
            Welcome to Prerna Store
          </h1>
          <p className="text-xs sm:text-sm text-[#8C6D53]">
            Sign in to your account to order or manage operations
          </p>
        </div>

        {/* University Panel Fast Login Pills */}
        <div className="bg-white rounded-2xl p-4 border-2 border-[#D9700F]/40 shadow-card space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-[#6B3A0A]">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D9700F]" />
              <span>University Panel Demo Accounts</span>
            </div>
            <span className="text-[10px] bg-[#FFF2E5] text-[#D9700F] font-bold px-2 py-0.5 rounded-full border border-[#D9700F]/30">
              2026@prerna
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleDemoLogin('customer@gmail.com', 'CUSTOMER', '2026@prerna')}
              className="flex items-center gap-2 p-2 rounded-xl border border-[#F0DEC8] hover:border-[#D9700F] hover:bg-[#FFF2E5] text-left transition-all"
            >
              <UserCheck className="w-4 h-4 text-[#D9700F] shrink-0" />
              <div>
                <div className="font-bold text-[#6B3A0A]">Customer</div>
                <div className="text-[10px] text-[#8C6D53]">customer@gmail.com</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('merchant@gmail.com', 'SHOPKEEPER', '2026@prerna')}
              className="flex items-center gap-2 p-2 rounded-xl border border-[#F0DEC8] hover:border-[#D9700F] hover:bg-[#FFF2E5] text-left transition-all"
            >
              <Store className="w-4 h-4 text-[#D9700F] shrink-0" />
              <div>
                <div className="font-bold text-[#6B3A0A]">Merchant</div>
                <div className="text-[10px] text-[#8C6D53]">merchant@gmail.com</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('deliverypartner@gmail.com', 'DELIVERY_PARTNER', '2026@prerna')}
              className="flex items-center gap-2 p-2 rounded-xl border border-[#F0DEC8] hover:border-[#D9700F] hover:bg-[#FFF2E5] text-left transition-all"
            >
              <Bike className="w-4 h-4 text-[#D9700F] shrink-0" />
              <div>
                <div className="font-bold text-[#6B3A0A]">Delivery Rider</div>
                <div className="text-[10px] text-[#8C6D53]">deliverypartner@...</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('admin@gmail.com', 'ADMIN', '2026@prerna')}
              className="flex items-center gap-2 p-2 rounded-xl border border-[#F0DEC8] hover:border-[#D9700F] hover:bg-[#FFF2E5] text-left transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-[#D9700F] shrink-0" />
              <div>
                <div className="font-bold text-[#6B3A0A]">Admin</div>
                <div className="text-[10px] text-[#8C6D53]">admin@gmail.com</div>
              </div>
            </button>
          </div>
        </div>

        {/* Regular Login Form */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#F0DEC8] shadow-card">
          {(formError || error) && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
              {formError || error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#6B3A0A] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#A66C3E] absolute left-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-xl text-xs sm:text-sm text-[#2D1B0D] placeholder-[#A66C3E]/60 focus:outline-none focus:border-[#D9700F] focus:ring-1 focus:ring-[#D9700F]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#6B3A0A]">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-semibold text-[#D9700F] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#A66C3E] absolute left-3 top-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-xl text-xs sm:text-sm text-[#2D1B0D] placeholder-[#A66C3E]/60 focus:outline-none focus:border-[#D9700F] focus:ring-1 focus:ring-[#D9700F]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#D9700F] text-white rounded-xl font-bold text-sm hover:bg-primary-hover transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-[#8C6D53]">
            Don't have an account?{' '}
            <Link href="/register" className="font-bold text-[#D9700F] hover:underline">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
