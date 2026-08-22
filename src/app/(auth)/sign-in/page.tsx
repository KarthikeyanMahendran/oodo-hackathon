'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, ShieldCheck, User, KeyRound, X, ShieldAlert } from 'lucide-react';
import { useHRMS } from '@/lib/context/HRMSContext';
import { Button, Input } from '@/components/ui';

const DEMO_ACCOUNTS = [
  { loginId: 'OISAJE20260001', role: 'HR Admin', name: 'Sarah Jenkins', icon: ShieldCheck },
  { loginId: 'OIALRI20260002', role: 'Employee', name: 'Alex Rivera', icon: User },
];

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
      if (login(loginIdOrEmail, password)) {
        router.push('/dashboard');
      } else {
        setErrorMsg('Invalid Login ID / Email or Password. Default password for all users is "pass123".');
        setIsSubmitting(false);
      }
    }, 300);
  };

  const quickLogin = (loginId: string) => {
    if (login(loginId, 'pass123')) router.push('/dashboard');
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
      router.push('/dashboard');
    } else {
      setOtpError(result.message);
    }
  };

  return (
    <div className="hr-auth">
      <div className="hr-auth-card">
        <div className="hr-auth-head">
          <span className="hr-brand-mark hr-auth-mark" aria-hidden />
          <h1>Sign in to Dayflow</h1>
          <p className="hr-subtext">Employees, attendance, leave and payroll.</p>
        </div>

        {errorMsg && <div className="hr-alert hr-alert-danger">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="hr-auth-form">
          <Input
            label="Login ID or email"
            value={loginIdOrEmail}
            onChange={(e) => setLoginIdOrEmail(e.target.value)}
            placeholder="OISAJE20260001"
            autoComplete="username"
            required
          />
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-zinc-300">Password</label>
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
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <Button type="submit" loading={isSubmitting} icon={<LogIn size={15} />} className="w-full">
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <div className="hr-auth-divider">
          <span>Or use a demo persona</span>
        </div>

        <div className="hr-auth-demos">
          {DEMO_ACCOUNTS.map((acc) => {
            const Icon = acc.icon;
            return (
              <button key={acc.loginId} type="button" className="hr-demo-card" onClick={() => quickLogin(acc.loginId)}>
                <div className="hr-demo-head">
                  <span className="hr-demo-role">{acc.role}</span>
                  <Icon size={14} aria-hidden />
                </div>
                <span className="hr-monospace hr-demo-id">{acc.loginId}</span>
                <span className="hr-cell-secondary">{acc.name}</span>
              </button>
            );
          })}
        </div>

        <p className="hr-auth-foot">
          Need an admin workspace? <Link href="/sign-up">Register here</Link>
        </p>
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
