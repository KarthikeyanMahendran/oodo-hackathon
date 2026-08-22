'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useHRMS } from '@/lib/context/HRMSContext';
import { Building2, LogIn, Lock, User, Sparkles, ShieldCheck, KeyRound, Check, X, ShieldAlert } from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();
  const { login, sendPasswordResetOTP, resetPasswordWithOTP } = useHRMS();

  const [loginIdOrEmail, setLoginIdOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OTP Reset Modal State
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [resetQuery, setResetQuery] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [demoOtp, setDemoOtp] = useState('');
  const [inputOtp, setInputOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpSuccessMsg, setOtpSuccessMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    setTimeout(() => {
      const success = login(loginIdOrEmail, password);
      if (success) {
        router.push('/employees');
      } else {
        setErrorMsg('Invalid Login ID / Email or Password. Default password for all users is "pass123".');
        setIsSubmitting(false);
      }
    }, 300);
  };

  const handleQuickDemoLogin = (loginId: string) => {
    const success = login(loginId, 'pass123');
    if (success) {
      router.push('/employees');
    }
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    const result = sendPasswordResetOTP(resetQuery);
    if (result.success && result.otp) {
      setOtpSent(true);
      setDemoOtp(result.otp);
      setOtpSuccessMsg(result.message);
    } else {
      setOtpError(result.message);
    }
  };

  const handleVerifyAndReset = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');

    if (inputOtp.trim() !== demoOtp) {
      setOtpError('Invalid OTP code. Please enter the 6-digit code sent to your email.');
      return;
    }

    const result = resetPasswordWithOTP(resetQuery, newPassword);
    if (result.success) {
      setIsOtpModalOpen(false);
      router.push('/employees');
    } else {
      setOtpError(result.message);
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
            Every workday, perfectly aligned. Default password: <strong className="text-white">pass123</strong>
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
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setResetQuery(loginIdOrEmail);
                  setOtpSent(false);
                  setOtpError('');
                  setIsOtpModalOpen(true);
                }}
                className="text-[11px] font-bold text-zinc-400 hover:text-white underline underline-offset-2"
              >
                Forgot Password / OTP Reset?
              </button>
            </div>
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

        {/* Demo Credentials section */}
        <div className="pt-4 border-t border-zinc-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-bold text-zinc-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-white" /> Quick Demo Accounts (Pass: pass123):
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickDemoLogin('OISAJE20260001')}
              className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-500 text-left transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-white">Sarah Jenkins</span>
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
              </div>
              <span className="block text-[10px] text-zinc-400 font-mono mt-0.5">OISAJE20260001</span>
              <span className="block text-[9px] uppercase font-bold text-white mt-1">HR ADMIN</span>
            </button>

            <button
              onClick={() => handleQuickDemoLogin('OIMACH20260003')}
              className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-500 text-left transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-zinc-200">Marcus Chen</span>
                <User className="w-3.5 h-3.5 text-zinc-400" />
              </div>
              <span className="block text-[10px] text-zinc-400 font-mono mt-0.5">OIMACH20260003</span>
              <span className="block text-[9px] uppercase font-bold text-zinc-400 mt-1">EMPLOYEE</span>
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

      {/* Forgot Password OTP Modal */}
      {isOtpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsOtpModalOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-900"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5">
              <div className="p-2.5 rounded-2xl bg-white text-black font-bold">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Reset Password via OTP</h3>
                <p className="text-xs text-zinc-400">
                  Verify identity and change initial default password
                </p>
              </div>
            </div>

            {otpError && (
              <div className="mb-4 p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-white shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Enter Login ID or Email *
                  </label>
                  <input
                    type="text"
                    required
                    value={resetQuery}
                    onChange={(e) => setResetQuery(e.target.value)}
                    placeholder="e.g. OISAJE20260001 or sarah.jenkins@acme.com"
                    className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-white font-mono"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOtpModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-300 text-xs font-bold hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-extrabold shadow"
                  >
                    Send OTP Verification
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyAndReset} className="space-y-4">
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
                  <span className="font-bold text-white block mb-0.5">Verification Code Dispatched!</span>
                  <span>{otpSuccessMsg}</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Enter 6-Digit OTP Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={inputOtp}
                    onChange={(e) => setInputOtp(e.target.value)}
                    placeholder="e.g. 849201"
                    className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm text-center text-white tracking-widest font-mono focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    New Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 chars)"
                    className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-white font-mono"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-300 text-xs font-bold hover:bg-zinc-800"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-extrabold shadow"
                  >
                    Verify OTP & Reset Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
