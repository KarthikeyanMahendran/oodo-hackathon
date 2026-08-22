'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  LogIn,
  ShieldCheck,
  User,
  Users,
  LayoutGrid,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  Wallet,
  ReceiptText,
  CheckSquare,
  Building2,
  Clock,
} from 'lucide-react';
import { useHRMS } from '@/lib/context/HRMSContext';
import { Button, Input, Modal } from '@/components/ui';

/**
 * Auto-rotating feature panel. Inline lucide icons + CSS transitions only —
 * no images and no network round-trips, so the panel paints instantly and
 * adds nothing to the bundle (every icon here is already used elsewhere).
 */
const SLIDES = [
  {
    title: 'Your whole workforce, at a glance',
    sub: 'Headcount, departments and who is in today — one dashboard, always current.',
    Hero: LayoutGrid,
    side: [Users, Building2, Activity],
    tone: 'is-blue',
  },
  {
    title: 'Attendance that tracks itself',
    sub: 'Punch in once and the timer runs live. Every shift lands in the register.',
    Hero: CalendarCheck,
    side: [Clock, Users, CalendarRange],
    tone: 'is-green',
  },
  {
    title: 'Leave requests, approved in a click',
    sub: 'Balances calculated automatically. Managers approve or reject with a reason.',
    Hero: CalendarDays,
    side: [CheckSquare, CalendarRange, Users],
    tone: 'is-violet',
  },
  {
    title: 'Payroll with the maths already done',
    sub: 'Basic, HRA, PF and professional tax derived from each wage — payslips included.',
    Hero: Wallet,
    side: [ReceiptText, ShieldCheck, Activity],
    tone: 'is-amber',
  },
];

const SLIDE_INTERVAL_MS = 4500;

export default function SignInPage() {
  const router = useRouter();
  const { login, employees, isLoading, sendPasswordResetOTP, resetPasswordWithOTP } = useHRMS();

  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

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
    <div className="hr-login">
      {/* Left — sign in */}
      <div className="hr-login-form-pane">
        <div className="hr-login-form-inner">
          <div className="hr-login-brand">
            <span className="hr-login-brand-icon" aria-hidden>
              <Activity size={20} strokeWidth={2.4} />
            </span>
            <div>
              <h1 className="hr-login-brand-title">Dayflow</h1>
              <p className="hr-login-brand-sub">People</p>
            </div>
          </div>

          <div className="hr-login-heading">
            <h2>Sign in</h2>
            <p>to access your HR workspace</p>
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

          {quickAccounts.length > 0 && (
            <>
              <div className="hr-auth-divider">
                <span>Or continue as</span>
              </div>

              <div className="hr-auth-demos">
                {quickAccounts.map((acc) => {
                  const Icon = acc.icon;
                  return (
                    <button
                      key={acc.loginId}
                      type="button"
                      className="hr-demo-card"
                      onClick={() => quickLogin(acc.loginId)}
                    >
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
            </>
          )}

          {isLoading && <p className="hr-form-hint">Loading directory…</p>}

          <p className="hr-auth-foot">
            Need an admin workspace? <Link href="/sign-up">Register here</Link>
          </p>
        </div>
      </div>

      {/* Right — auto-rotating feature panel */}
      <div className="hr-login-visual">
        <div className="hr-login-carousel">
          {SLIDES.map((s, i) => {
            const Hero = s.Hero;
            return (
              <div
                key={s.title}
                className={`hr-login-slide ${s.tone}${i === slide ? ' is-active' : ''}`}
                aria-hidden={i !== slide}
              >
                <div className="hr-login-stage">
                  <div className="hr-login-hero">
                    <Hero size={52} strokeWidth={1.6} />
                  </div>
                  {s.side.map((Icon, idx) => (
                    <div key={idx} className={`hr-login-orb is-orb-${idx + 1}`}>
                      <Icon size={18} strokeWidth={1.8} />
                    </div>
                  ))}
                </div>
                <div className="hr-login-caption">
                  <h3>{s.title}</h3>
                  <p>{s.sub}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="hr-login-dots">
          {SLIDES.map((s, i) => (
            <button
              key={s.title}
              type="button"
              onClick={() => setSlide(i)}
              className={`hr-login-dot${i === slide ? ' is-active' : ''}`}
              aria-label={`Show feature ${i + 1}`}
            />
          ))}
        </div>
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
