'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Phone, ArrowRight, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/lib/store/useAuthStore';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Please enter your full name');
      return;
    }
    if (!email.trim()) {
      setFormError('Please enter your email address');
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long');
      return;
    }

    try {
      const newUser = await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        password,
      });

      setIsSuccess(true);
      // Hard refresh navigation so Navbar and layout immediately reflect the authenticated session
      setTimeout(() => {
        window.location.href = '/';
      }, 800);
    } catch (err: any) {
      setFormError(err.message || 'Registration failed. Please check your network and try again.');
    }
  };

  const handleQuickFill = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setName(`Test User ${randomNum}`);
    setEmail(`student${randomNum}@gmail.com`);
    setPhone('+91 98765 ' + randomNum);
    setPassword('2026@prerna');
    setFormError(null);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#D9700F] text-white flex items-center justify-center font-black text-2xl mx-auto shadow-md shadow-orange-500/20">
            P
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#6B3A0A] tracking-tight">
            Create an Account
          </h1>
          <p className="text-xs sm:text-sm text-[#8C6D53]">
            Join Prerna Store for fresh local groceries in 10 minutes
          </p>
        </div>

        {/* Quick test generator pill */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleQuickFill}
            className="text-xs text-[#D9700F] hover:text-[#6B3A0A] font-bold flex items-center gap-1.5 transition-colors bg-[#FFF2E5] px-3 py-1.5 rounded-full border border-[#D9700F]/30"
          >
            <Sparkles className="w-3 h-3" />
            <span>Auto-fill Test Details</span>
          </button>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#F0DEC8] shadow-card">
          {isSuccess && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-2xl text-xs font-bold text-green-800 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
              <div>
                <p className="font-extrabold text-sm">Account created successfully!</p>
                <p className="font-normal text-green-700">Redirecting you to the storefront...</p>
              </div>
            </div>
          )}

          {(formError || error) && !isSuccess && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{formError || error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#6B3A0A] mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#A66C3E] absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-xl text-xs sm:text-sm text-[#2D1B0D] placeholder-[#A66C3E]/60 focus:outline-none focus:border-[#D9700F]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6B3A0A] mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#A66C3E] absolute left-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-xl text-xs sm:text-sm text-[#2D1B0D] placeholder-[#A66C3E]/60 focus:outline-none focus:border-[#D9700F]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6B3A0A] mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#A66C3E] absolute left-3 top-3 pointer-events-none" />
                <input
                  type="tel"
                  placeholder="+91 99887 76655"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-xl text-xs sm:text-sm text-[#2D1B0D] placeholder-[#A66C3E]/60 focus:outline-none focus:border-[#D9700F]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6B3A0A] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#A66C3E] absolute left-3 top-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-xl text-xs sm:text-sm text-[#2D1B0D] placeholder-[#A66C3E]/60 focus:outline-none focus:border-[#D9700F]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || isSuccess}
              className="w-full py-3 bg-[#D9700F] text-white rounded-xl font-bold text-sm hover:bg-primary-hover transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <span>{isSuccess ? 'Success!' : isLoading ? 'Creating Account...' : 'Register'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-[#8C6D53]">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-[#D9700F] hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
