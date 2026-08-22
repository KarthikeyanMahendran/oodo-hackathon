'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, ShieldCheck, User, KeyRound } from 'lucide-react';
import { useHRMS } from '@/lib/context/HRMSContext';
import { Button, Input, Modal } from '@/components/ui';

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
              <label className="hr-form-label">Password *</label>
              <button
                type="button"
                onClick={() => {
                  setResetQuery(loginIdOrEmail);
                  setOtpSent(false);
                  setOtpError('');
                  setIsOtpModalOpen(true);
                }}
                className="text-[12px] font-medium text-muted hover:text-primary underline cursor-pointer"
              >
                Forgot Password / OTP Reset?
              </button>
            </div>
            <input
              type="password"
              className="hr-input"
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
      <Modal
        isOpen={isOtpModalOpen}
        onClose={() => setIsOtpModalOpen(false)}
        title="Reset Password via OTP"
        subtitle="Verify identity and change initial default password"
        size="md"
      >
        {otpError && <div className="hr-alert hr-alert-danger mb-4">{otpError}</div>}

        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="hr-auth-form">
            <Input
              label="Enter Login ID or Email"
              required
              value={resetQuery}
              onChange={(e) => setResetQuery(e.target.value)}
              placeholder="e.g. OISAJE20260001 or sarah.jenkins@acme.com"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setIsOtpModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Send OTP Verification
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyAndReset} className="hr-auth-form">
            <div className="hr-alert hr-alert-info">
              <strong>Verification Code Dispatched!</strong>
              <div>{otpSuccessMsg}</div>
            </div>

            <Input
              label="Enter 6-Digit OTP Code"
              required
              maxLength={6}
              value={inputOtp}
              onChange={(e) => setInputOtp(e.target.value)}
              placeholder="e.g. 849201"
            />

            <Input
              label="New Password"
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 6 chars)"
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setOtpSent(false)}>
                Back
              </Button>
              <Button type="submit" variant="primary">
                Verify OTP & Reset Password
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
