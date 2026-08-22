'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LogIn, ShieldCheck, User } from 'lucide-react';
import { useHRMS } from '@/lib/context/HRMSContext';
import { Button, Input, Modal } from '@/components/ui';

export default function SignInPage() {
  const router = useRouter();
  const { login, employees, isLoading, sendPasswordResetOTP, resetPasswordWithOTP } = useHRMS();

  // Sign-in shortcuts are built from the real directory, not a hardcoded list.
  const quickAccounts = employees.slice(0, 2).map((e) => ({
    loginId: e.login_id,
    role: e.role === 'ADMIN' ? 'HR Admin' : e.job_position || 'Employee',
    name: `${e.first_name} ${e.last_name}`.trim(),
    icon: e.role === 'ADMIN' ? ShieldCheck : User,
  }));

  const [loginIdOrEmail, setLoginIdOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot-password OTP modal state.
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [resetQuery, setResetQuery] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [expectedOtp, setExpectedOtp] = useState('');
  const [inputOtp, setInputOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpInfo, setOtpInfo] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    const ok = await login(loginIdOrEmail, password);
    if (ok) {
      router.push('/dashboard');
    } else {
      setErrorMsg('No employee found for that login ID or email.');
      setIsSubmitting(false);
    }
  };

  const quickLogin = async (loginId: string) => {
    if (await login(loginId, 'pass123')) router.push('/dashboard');
  };

  const openResetModal = () => {
    setResetQuery(loginIdOrEmail);
    setOtpSent(false);
    setInputOtp('');
    setOtpError('');
    setOtpModalOpen(true);
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    const result = sendPasswordResetOTP(resetQuery);
    if (result.success && result.otp) {
      setOtpSent(true);
      setExpectedOtp(result.otp);
      setOtpInfo(result.message);
    } else {
      setOtpError(result.message);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');

    if (inputOtp.trim() !== expectedOtp) {
      setOtpError('That code doesn’t match. Check the code shown below and try again.');
      return;
    }

    setVerifying(true);
    const result = await resetPasswordWithOTP(resetQuery);
    setVerifying(false);
    if (result.success) {
      setOtpModalOpen(false);
      router.push('/dashboard');
    } else {
      setOtpError(result.message);
    }
  };

  return (
    <div className="hr-auth">
      <div className="hr-auth-card">
        <div className="hr-auth-head">
          <div className="mb-2 flex justify-center">
            <Image
              src="/gemini-svg.svg"
              alt="Dayflow Logo"
              width={220}
              height={66}
              style={{ objectFit: 'contain', height: '56px', width: 'auto' }}
              priority
            />
          </div>
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
          <div className="hr-form-group">
            <div className="hr-form-row-between">
              <label className="hr-form-label">Password</label>
              <button type="button" className="hr-link-ghost" onClick={openResetModal}>
                Forgot password?
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



        {isLoading && <p className="hr-form-hint">Loading directory…</p>}

        <p className="hr-auth-foot">
          Need an admin workspace? <Link href="/sign-up">Register here</Link>
        </p>
      </div>

      <Modal
        isOpen={otpModalOpen}
        onClose={() => setOtpModalOpen(false)}
        title="Verify your identity"
        subtitle={otpSent ? 'Enter the code below to sign in' : 'Confirm your login ID or email'}
        size="sm"
        footer={
          otpSent ? (
            <>
              <Button variant="secondary" onClick={() => setOtpSent(false)}>
                Back
              </Button>
              <Button onClick={handleVerify} loading={verifying}>
                Verify &amp; sign in
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setOtpModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendOtp}>Send code</Button>
            </>
          )
        }
      >
        {otpError && <div className="hr-alert hr-alert-danger">{otpError}</div>}

        {!otpSent ? (
          <>
            <p className="hr-form-hint" style={{ marginTop: 0 }}>
              No email service is configured in this environment, so the verification code is shown on screen
              rather than sent — this flow demonstrates the UX, not real delivery.
            </p>
            <Input
              label="Login ID or email"
              value={resetQuery}
              onChange={(e) => setResetQuery(e.target.value)}
              placeholder="e.g. OISAJE20260001 or sarah.jenkins@acme.com"
              required
            />
          </>
        ) : (
          <>
            <div className="hr-alert hr-alert-info">{otpInfo}</div>
            <Input
              label="Verification code"
              value={inputOtp}
              onChange={(e) => setInputOtp(e.target.value)}
              placeholder="6-digit code"
              maxLength={6}
              required
            />
          </>
        )}
      </Modal>
    </div>
  );
}
