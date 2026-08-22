'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useHRMS } from '@/lib/context/HRMSContext';
import { Building2, LogIn, Lock, User, Sparkles, ShieldCheck } from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();
  const { login } = useHRMS();

  const [loginIdOrEmail, setLoginIdOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    setTimeout(() => {
      const success = login(loginIdOrEmail, password);
      if (success) {
        router.push('/employees');
      } else {
        setErrorMsg('Invalid Login ID / Email or Password. Try one-click demo accounts below.');
        setIsSubmitting(false);
      }
    }, 400);
  };

  const handleQuickDemoLogin = (loginId: string) => {
    const success = login(loginId, 'pass123');
    if (success) {
      router.push('/employees');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8 bg-zinc-950 border border-zinc-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white text-black mb-1 shadow-lg">
            <Building2 className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Sign In to Dayflow
          </h2>
          <p className="text-xs text-zinc-400 font-mono">
            Every workday, perfectly aligned.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">
              Login ID or Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={loginIdOrEmail}
                onChange={(e) => setLoginIdOrEmail(e.target.value)}
                placeholder="e.g. OISAJE20260001 or sarah.jenkins@acme.com"
                className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-all font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-sm shadow-xl transition-all duration-200 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>{isSubmitting ? 'Signing in...' : 'Sign In to Portal'}</span>
          </button>
        </form>

        {/* Demo Preset Credentials section */}
        <div className="pt-4 border-t border-zinc-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-bold text-zinc-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-white" /> One-Click Demo Personas:
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickDemoLogin('OISAJE20260001')}
              className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-500 text-left transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-white">HR Admin</span>
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
              </div>
              <span className="block text-[11px] text-zinc-400 font-mono mt-0.5">OISAJE20260001</span>
              <span className="block text-[10px] text-zinc-500">Sarah Jenkins</span>
            </button>

            <button
              onClick={() => handleQuickDemoLogin('OIALRI20260002')}
              className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-500 text-left transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-zinc-200">Employee</span>
                <User className="w-3.5 h-3.5 text-zinc-400" />
              </div>
              <span className="block text-[11px] text-zinc-400 font-mono mt-0.5">OIALRI20260002</span>
              <span className="block text-[10px] text-zinc-500">Alex Rivera</span>
            </button>
          </div>
        </div>

        {/* Link to Registration */}
        <div className="text-center pt-2">
          <p className="text-xs text-zinc-400">
            Need to register an Admin/Company account?{' '}
            <Link href="/sign-up" className="text-white hover:underline font-bold underline-offset-4">
              Register HR Workspace
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
